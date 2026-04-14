from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta
from typing import Dict, List, Tuple
import random

import numpy as np

from app.models import (
    FarmRequest,
    GASettings,
    OptimizationRequest,
    OptimizationResponse,
    OptimizationSummary,
    PeelerGroup,
    PeelerSchedule,
    ScheduledFarm,
)
from app.optimizer.distance import haversine_km


CATEGORY_PRIORITY: Dict[str, int] = {
    "ALBA": 5,
    "C5_SPECIAL": 4,
    "C5": 3,
    "H1": 2,
    "H2": 1,
    "OTHER": 1,
}


@dataclass
class Chromosome:
    """
    Full VRP chromosome.

    route_order:
        A permutation of harvest-ready farm indexes. This controls the global visit order.
    vehicle_assignment:
        vehicle_assignment[farm_index] = peeler index. This controls which Kalliya group
        serves each farm.

    Decoding rule:
        Read route_order left to right and place each farm into its assigned peeler route.
        This gives each peeler a real ordered route, not just a random group of farms.
    """

    route_order: np.ndarray
    vehicle_assignment: np.ndarray
    cost: float | None = None


@dataclass
class RouteSimulationResult:
    scheduled_day: date | None
    late_days: int
    overload_hours: float
    available_hours: float
    used_hours: float


class CinnamonHarvestVRPGAOptimizer:
    """
    Genetic Algorithm based Vehicle Routing Problem optimizer for cinnamon harvesting.

    This optimizer solves BOTH parts of the routing problem:
      1. Assignment: which Kalliya peeler group should serve each farm.
      2. Sequencing: in what order each group should visit its assigned farms.

    Fitness minimizes:
      - total route distance including return-to-base approximation
      - missed peelability deadlines
      - harvest before ready date
      - peeler capacity overload
      - urgent/high-grade farms appearing late in a route
      - workload imbalance between peeler groups
      - assigning high-urgency farms to lower-rated groups
    """

    def __init__(self, request: OptimizationRequest):
        self.request = request
        self.farms: List[FarmRequest] = [f for f in request.farms if f.harvestReady]
        self.peelers: List[PeelerGroup] = request.peelerGroups
        self.weights = request.weights
        self.settings: GASettings = request.settings
        self.rng = random.Random(self.settings.randomSeed)
        self.np_rng = np.random.default_rng(self.settings.randomSeed)
        self.week_days = [request.weekStart + timedelta(days=i) for i in range(7)]

        if not self.farms:
            raise ValueError("No harvest-ready farms were provided.")
        if not self.peelers:
            raise ValueError("At least one peeler group is required.")

        self.distance_matrix = self._build_farm_distance_matrix()
        self.peeler_to_farm_distance = self._build_peeler_to_farm_distance_matrix()

    def optimize(self) -> OptimizationResponse:
        population = self._initial_population()
        best = min(population, key=self._evaluate)

        for _ in range(self.settings.generations):
            population = sorted(population, key=self._evaluate)
            if self._evaluate(population[0]) < self._evaluate(best):
                best = self._clone(population[0])

            next_population = [self._clone(c) for c in population[: self.settings.elitismCount]]

            while len(next_population) < self.settings.populationSize:
                p1 = self._tournament(population)
                p2 = self._tournament(population)
                c1, c2 = self._crossover(p1, p2)
                self._mutate(c1)
                self._mutate(c2)
                next_population.extend([c1, c2])

            population = next_population[: self.settings.populationSize]

        best = min(population + [best], key=self._evaluate)
        best = self._route_local_search(best)
        return self._build_response(best)

    # -------------------------- Initialization --------------------------

    def _initial_population(self) -> List[Chromosome]:
        population: List[Chromosome] = []
        population.append(self._nearest_neighbor_seed())
        population.append(self._capacity_aware_seed())
        while len(population) < self.settings.populationSize:
            population.append(self._random_chromosome())
        return population

    def _random_chromosome(self) -> Chromosome:
        route_order = self.np_rng.permutation(len(self.farms))
        vehicle_assignment = self.np_rng.integers(0, len(self.peelers), size=len(self.farms))
        return Chromosome(route_order=route_order, vehicle_assignment=vehicle_assignment)

    def _nearest_neighbor_seed(self) -> Chromosome:
        """Create one good initial solution using nearest peeler + urgency sorting."""
        farm_indexes = list(range(len(self.farms)))
        farm_indexes.sort(
            key=lambda i: (
                -self.farms[i].urgency,
                -CATEGORY_PRIORITY.get(self.farms[i].processingCategory.value, 1),
                self.farms[i].peelabilityDeadline or date.max,
            )
        )
        assignments = np.zeros(len(self.farms), dtype=int)
        for farm_idx in farm_indexes:
            assignments[farm_idx] = int(np.argmin(self.peeler_to_farm_distance[:, farm_idx]))
        return Chromosome(route_order=np.array(farm_indexes, dtype=int), vehicle_assignment=assignments)

    def _capacity_aware_seed(self) -> Chromosome:
        """Seed solution that tries to distribute hours across available Kalliya capacity."""
        remaining_hours = []
        for peeler in self.peelers:
            available_days = self._valid_days(peeler)
            remaining_hours.append(len(available_days) * peeler.maxHoursPerDay)

        assignments = np.zeros(len(self.farms), dtype=int)
        sorted_farms = sorted(
            range(len(self.farms)),
            key=lambda i: (-self.farms[i].treeCount, -self.farms[i].urgency),
        )

        for farm_idx in sorted_farms:
            scores = []
            for peeler_idx, peeler in enumerate(self.peelers):
                work_hours = self.farms[farm_idx].treeCount / peeler.capacityTreesPerHour
                shortage = max(0.0, work_hours - remaining_hours[peeler_idx])
                distance = self.peeler_to_farm_distance[peeler_idx, farm_idx]
                scores.append(distance + shortage * 100)
            selected = int(np.argmin(scores))
            assignments[farm_idx] = selected
            remaining_hours[selected] -= self.farms[farm_idx].treeCount / self.peelers[selected].capacityTreesPerHour

        return Chromosome(route_order=np.array(sorted_farms, dtype=int), vehicle_assignment=assignments)

    # -------------------------- Fitness / decoding --------------------------

    def _routes_from_chromosome(self, chromosome: Chromosome) -> Dict[int, List[int]]:
        routes: Dict[int, List[int]] = {idx: [] for idx in range(len(self.peelers))}
        for farm_idx in chromosome.route_order:
            peeler_idx = int(chromosome.vehicle_assignment[int(farm_idx)])
            routes[peeler_idx].append(int(farm_idx))
        return routes

    def _evaluate(self, chromosome: Chromosome) -> float:
        if chromosome.cost is not None:
            return chromosome.cost

        routes = self._routes_from_chromosome(chromosome)
        total_distance = 0.0
        total_work_hours_by_peeler: List[float] = []
        overload_penalty = 0.0
        lateness_penalty = 0.0
        early_penalty = 0.0
        urgency_order_penalty = 0.0
        category_order_penalty = 0.0
        rating_penalty = 0.0
        unused_vehicle_penalty = 0.0

        for peeler_idx, farm_indices in routes.items():
            peeler = self.peelers[peeler_idx]
            day_loads = self._empty_day_loads(peeler)
            work_hours_for_peeler = 0.0

            if not farm_indices:
                unused_vehicle_penalty += 1.0
                total_work_hours_by_peeler.append(0.0)
                continue

            total_distance += self._route_distance(peeler_idx, farm_indices)

            for seq, farm_idx in enumerate(farm_indices, start=1):
                farm = self.farms[farm_idx]
                work_hours = farm.treeCount / peeler.capacityTreesPerHour
                work_hours_for_peeler += work_hours
                sim = self._simulate_place_job(day_loads, peeler, farm, work_hours)

                overload_penalty += sim.overload_hours * self.weights.capacityOverload
                lateness_penalty += sim.late_days * farm.urgency * self.weights.lateness

                if sim.scheduled_day and farm.readyFrom and sim.scheduled_day < farm.readyFrom:
                    early_penalty += (farm.readyFrom - sim.scheduled_day).days * self.weights.urgency * farm.urgency

                # Route order matters in VRP. High urgency and high-grade farms should be earlier.
                order_penalty = seq - 1
                urgency_order_penalty += order_penalty * farm.urgency * self.weights.urgency / 8
                category_priority = CATEGORY_PRIORITY.get(farm.processingCategory.value, 1)
                category_order_penalty += order_penalty * category_priority * self.weights.categoryPriority / 8
                rating_penalty += (5.0 - peeler.rating) * farm.urgency * self.weights.lowRatedPeelerPenalty

            total_work_hours_by_peeler.append(work_hours_for_peeler)

        balance_penalty = 0.0
        if len(total_work_hours_by_peeler) > 1:
            balance_penalty = float(np.std(total_work_hours_by_peeler)) * self.weights.workloadBalance

        # Mild penalty so GA does not put all farms into one route unless distance/capacity says so.
        unused_vehicle_penalty *= 2.0

        chromosome.cost = (
            total_distance * self.weights.distance
            + overload_penalty
            + lateness_penalty
            + early_penalty
            + urgency_order_penalty
            + category_order_penalty
            + balance_penalty
            + rating_penalty
            + unused_vehicle_penalty
        )
        return chromosome.cost

    def _route_distance(self, peeler_idx: int, farm_indices: List[int]) -> float:
        if not farm_indices:
            return 0.0
        distance = self.peeler_to_farm_distance[peeler_idx, farm_indices[0]]
        for a, b in zip(farm_indices, farm_indices[1:]):
            distance += self.distance_matrix[a, b]
        # Return-to-base approximation makes it a true route cycle and prevents unrealistic one-way routes.
        distance += self.peeler_to_farm_distance[peeler_idx, farm_indices[-1]]
        return float(distance)

    def _empty_day_loads(self, peeler: PeelerGroup) -> Dict[date, float]:
        valid_days = self._valid_days(peeler)
        return {d: 0.0 for d in self.week_days if d in valid_days}

    def _valid_days(self, peeler: PeelerGroup) -> set[date]:
        return set(peeler.availableDays) if peeler.availableDays else set(self.week_days)

    def _simulate_place_job(
        self,
        day_loads: Dict[date, float],
        peeler: PeelerGroup,
        farm: FarmRequest,
        work_hours: float,
    ) -> RouteSimulationResult:
        if not day_loads:
            return RouteSimulationResult(None, 7, work_hours, 0.0, 0.0)

        candidate_days = sorted(day_loads)
        if farm.readyFrom:
            candidate_days = [d for d in candidate_days if d >= farm.readyFrom] or sorted(day_loads)

        for day in candidate_days:
            if day_loads[day] + work_hours <= peeler.maxHoursPerDay:
                day_loads[day] += work_hours
                late_days = self._late_days(day, farm)
                return RouteSimulationResult(day, late_days, 0.0, len(day_loads) * peeler.maxHoursPerDay, sum(day_loads.values()))

        # If no full slot exists, place it on the least loaded valid day and penalize overload.
        least_loaded_day = min(candidate_days, key=day_loads.get)
        overload = max(0.0, day_loads[least_loaded_day] + work_hours - peeler.maxHoursPerDay)
        day_loads[least_loaded_day] += work_hours
        late_days = self._late_days(least_loaded_day, farm)
        return RouteSimulationResult(
            least_loaded_day,
            late_days,
            overload,
            len(day_loads) * peeler.maxHoursPerDay,
            sum(day_loads.values()),
        )

    @staticmethod
    def _late_days(scheduled_day: date, farm: FarmRequest) -> int:
        if farm.peelabilityDeadline and scheduled_day > farm.peelabilityDeadline:
            return (scheduled_day - farm.peelabilityDeadline).days
        return 0

    # -------------------------- GA operators --------------------------

    def _tournament(self, population: List[Chromosome]) -> Chromosome:
        participants = self.rng.sample(population, self.settings.tournamentSize)
        return min(participants, key=self._evaluate)

    def _crossover(self, p1: Chromosome, p2: Chromosome) -> Tuple[Chromosome, Chromosome]:
        if self.rng.random() > self.settings.crossoverRate:
            return self._clone(p1), self._clone(p2)

        c1_order = self._ordered_crossover(p1.route_order, p2.route_order)
        c2_order = self._ordered_crossover(p2.route_order, p1.route_order)

        mask = self.np_rng.random(len(self.farms)) < 0.5
        c1_assignment = np.where(mask, p1.vehicle_assignment, p2.vehicle_assignment)
        c2_assignment = np.where(mask, p2.vehicle_assignment, p1.vehicle_assignment)

        return Chromosome(c1_order, c1_assignment), Chromosome(c2_order, c2_assignment)

    def _ordered_crossover(self, parent_a: np.ndarray, parent_b: np.ndarray) -> np.ndarray:
        """Order crossover keeps a valid permutation for the VRP route sequence."""
        n = len(parent_a)
        start, end = sorted(self.rng.sample(range(n), 2))
        child = np.full(n, -1, dtype=int)
        child[start:end] = parent_a[start:end]
        fill_values = [gene for gene in parent_b if gene not in set(child[start:end])]
        fill_idx = 0
        for i in range(n):
            if child[i] == -1:
                child[i] = fill_values[fill_idx]
                fill_idx += 1
        return child

    def _mutate(self, chromosome: Chromosome) -> None:
        changed = False
        n = len(self.farms)

        # Swap mutation for route order.
        if self.rng.random() < self.settings.mutationRate:
            i, j = self.rng.sample(range(n), 2)
            chromosome.route_order[i], chromosome.route_order[j] = chromosome.route_order[j], chromosome.route_order[i]
            changed = True

        # Inversion mutation improves route sequencing.
        if self.rng.random() < self.settings.mutationRate:
            i, j = sorted(self.rng.sample(range(n), 2))
            chromosome.route_order[i:j] = chromosome.route_order[i:j][::-1]
            changed = True

        # Reassign some farms to a different peeler group.
        for i in range(n):
            if self.rng.random() < self.settings.mutationRate / 2:
                chromosome.vehicle_assignment[i] = self.rng.randrange(len(self.peelers))
                changed = True

        if changed:
            chromosome.cost = None

    # -------------------------- Local search --------------------------

    def _route_local_search(self, chromosome: Chromosome) -> Chromosome:
        """Light 2-opt local search on decoded routes for stronger final VRP routes."""
        routes = self._routes_from_chromosome(chromosome)
        improved_routes: Dict[int, List[int]] = {}
        for peeler_idx, route in routes.items():
            improved_routes[peeler_idx] = self._two_opt_route(peeler_idx, route)

        new_order: List[int] = []
        for peeler_idx in range(len(self.peelers)):
            new_order.extend(improved_routes[peeler_idx])

        improved = Chromosome(
            route_order=np.array(new_order, dtype=int),
            vehicle_assignment=np.copy(chromosome.vehicle_assignment),
        )
        return improved if self._evaluate(improved) <= self._evaluate(chromosome) else chromosome

    def _two_opt_route(self, peeler_idx: int, route: List[int]) -> List[int]:
        if len(route) < 4:
            return route
        best = route[:]
        best_distance = self._route_distance(peeler_idx, best)
        improved = True
        while improved:
            improved = False
            for i in range(1, len(best) - 2):
                for j in range(i + 1, len(best)):
                    if j - i == 1:
                        continue
                    candidate = best[:]
                    candidate[i:j] = best[j - 1 : i - 1 : -1]
                    candidate_distance = self._route_distance(peeler_idx, candidate)
                    if candidate_distance < best_distance:
                        best = candidate
                        best_distance = candidate_distance
                        improved = True
            route = best
        return best

    # -------------------------- Response building --------------------------

    def _build_response(self, chromosome: Chromosome) -> OptimizationResponse:
        routes = self._routes_from_chromosome(chromosome)
        peeler_schedules: List[PeelerSchedule] = []
        total_distance = 0.0
        total_work_hours = 0.0
        assigned_tree_count = 0
        utilization_values: List[float] = []
        notes: List[str] = []

        for peeler_idx, farm_indices in routes.items():
            peeler = self.peelers[peeler_idx]
            day_loads = self._empty_day_loads(peeler)
            route_items: List[ScheduledFarm] = []
            peeler_distance = 0.0
            peeler_hours = 0.0
            peeler_trees = 0
            previous_farm_idx: int | None = None

            for seq, farm_idx in enumerate(farm_indices, start=1):
                farm = self.farms[farm_idx]
                if previous_farm_idx is None:
                    travel = self.peeler_to_farm_distance[peeler_idx, farm_idx]
                else:
                    travel = self.distance_matrix[previous_farm_idx, farm_idx]
                previous_farm_idx = farm_idx

                work_hours = farm.treeCount / peeler.capacityTreesPerHour
                sim = self._simulate_place_job(day_loads, peeler, farm, work_hours)

                warning = None
                if sim.scheduled_day is None:
                    warning = "No available day for this peeler group."
                elif farm.readyFrom and sim.scheduled_day < farm.readyFrom:
                    warning = "Scheduled before the requested ready date due to limited availability."
                elif farm.peelabilityDeadline and sim.scheduled_day > farm.peelabilityDeadline:
                    warning = f"Scheduled {sim.late_days} day(s) after peelability deadline."
                elif sim.overload_hours > 0:
                    warning = f"Daily capacity exceeded by {round(sim.overload_hours, 2)} hour(s)."
                elif work_hours > peeler.maxHoursPerDay:
                    warning = "Farm may require splitting across multiple working days."

                route_items.append(
                    ScheduledFarm(
                        farmId=farm.id,
                        farmName=farm.farmName,
                        sequence=seq,
                        scheduledDate=sim.scheduled_day,
                        travelKmFromPrevious=round(float(travel), 3),
                        estimatedWorkHours=round(work_hours, 2),
                        urgency=farm.urgency,
                        processingCategory=farm.processingCategory,
                        warning=warning,
                    )
                )
                peeler_distance += float(travel)
                peeler_hours += work_hours
                peeler_trees += farm.treeCount

            # Add return-to-base to total route distance, but keep travelKmFromPrevious as actual leg-to-farm.
            if farm_indices:
                peeler_distance += float(self.peeler_to_farm_distance[peeler_idx, farm_indices[-1]])

            available_hours = len(day_loads) * peeler.maxHoursPerDay if day_loads else 0
            if available_hours:
                utilization_values.append(min(100.0, peeler_hours / available_hours * 100))

            total_distance += peeler_distance
            total_work_hours += peeler_hours
            assigned_tree_count += peeler_trees

            peeler_schedules.append(
                PeelerSchedule(
                    peelerGroupId=peeler.id,
                    groupName=peeler.groupName,
                    totalTravelKm=round(peeler_distance, 3),
                    totalWorkHours=round(peeler_hours, 2),
                    assignedTreeCount=peeler_trees,
                    route=route_items,
                )
            )

        if any(len(self._empty_day_loads(p)) == 0 for p in self.peelers):
            notes.append("One or more peeler groups have no available days within the selected week.")
        notes.append("This is a full GA-based VRP: it optimizes both Kalliya-to-farm assignment and farm visit order.")
        notes.append("Distances use haversine GPS distance with return-to-base approximation. Replace with Google Distance Matrix API for road-distance production results.")

        avg_utilization = float(np.mean(utilization_values)) if utilization_values else 0.0
        return OptimizationResponse(
            status="success",
            summary=OptimizationSummary(
                totalTravelKm=round(total_distance, 3),
                totalWorkHours=round(total_work_hours, 2),
                assignedFarmCount=len(self.farms),
                unassignedFarmCount=0,
                averageUtilizationPercent=round(avg_utilization, 2),
                fitnessCost=round(self._evaluate(chromosome), 3),
                generationsExecuted=self.settings.generations,
            ),
            schedules=peeler_schedules,
            unassignedFarmIds=[],
            notes=notes,
        )

    # -------------------------- Distance matrices --------------------------

    def _build_farm_distance_matrix(self) -> np.ndarray:
        n = len(self.farms)
        matrix = np.zeros((n, n), dtype=float)
        for i in range(n):
            for j in range(n):
                if i != j:
                    matrix[i, j] = haversine_km(self.farms[i].location, self.farms[j].location)
        return matrix

    def _build_peeler_to_farm_distance_matrix(self) -> np.ndarray:
        matrix = np.zeros((len(self.peelers), len(self.farms)), dtype=float)
        for p_idx, peeler in enumerate(self.peelers):
            for f_idx, farm in enumerate(self.farms):
                matrix[p_idx, f_idx] = haversine_km(peeler.location, farm.location)
        return matrix

    @staticmethod
    def _clone(chromosome: Chromosome) -> Chromosome:
        return Chromosome(
            route_order=np.copy(chromosome.route_order),
            vehicle_assignment=np.copy(chromosome.vehicle_assignment),
            cost=chromosome.cost,
        )


def optimize_harvest_schedule(request: OptimizationRequest) -> OptimizationResponse:
    return CinnamonHarvestVRPGAOptimizer(request).optimize()
