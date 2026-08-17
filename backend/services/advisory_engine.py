from services.knowledge_base import collection


def get_advisory(ph: float, moisture: float, temp: float, risk: str, confidence: float):
    """
    RAG retrieval + rule-based formatting for cinnamon WRR advisory.
    """
    query = _build_rag_query(ph, moisture, temp, risk)

    results = collection.query(
        query_texts=[query],
        n_results=4,
        include=["documents", "metadatas", "distances"]
    )

    advisory = {
        "input_conditions": {
            "soil_pH": ph,
            "soil_moisture_percent": moisture,
            "temperature_c": temp,
            "predicted_risk": risk,
            "model_confidence": round(confidence, 3)
        },
        "retrieved_passages": results["documents"][0],
        "sources": list(set(m["source"] for m in results["metadatas"][0])),
        "report": _generate_report(ph, moisture, temp, risk, confidence, results),
        "immediate_actions": _get_immediate_actions(risk, ph, moisture, temp),
        "preventive_measures": _get_preventive_measures(),
        "monitoring_plan": _get_monitoring_plan(risk),
        "disclaimer": _get_disclaimer(confidence)
    }

    return advisory


def _build_rag_query(ph: float, moisture: float, temp: float, risk: str) -> str:
    """Map raw sensor values to semantic terms matching your KB."""
    terms = []

    # pH mapping (aligned to YOUR KB)
    if ph < 4.5 or ph > 7.0:
        terms.append("critical pH soil stress root rot Department of Export Agriculture")
    elif 4.5 <= ph < 5.5:
        terms.append("acidic soil pH 4.5 to 5.5 high risk fungal growth")
    elif 5.5 <= ph <= 6.5:
        terms.append("optimal pH 5.5 to 6.5 cinnamon cultivation DOA recommendations")
    elif 6.5 < ph <= 7.0:
        terms.append("slightly alkaline pH 6.5 to 7.0 suboptimal cinnamon")

    # Moisture mapping (aligned to YOUR KB)
    if moisture > 60:
        terms.append("soil moisture above 60 percent waterlogging critical drainage")
    elif 45 <= moisture <= 60:
        terms.append("soil moisture 45 to 60 percent high risk fungal pathogen growth")
    elif 30 <= moisture < 45:
        terms.append("soil moisture 30 to 45 percent medium risk early warning")
    else:
        terms.append("soil moisture below 30 percent low risk dry conditions")

    # Temperature mapping (aligned to YOUR KB)
    if temp > 30:
        terms.append("temperature above 30 degrees critical heat stress urgent")
    elif 25 <= temp <= 30:
        terms.append("temperature 25 to 30 degrees optimal fungal growth warm humid")
    elif 23 <= temp < 25:
        terms.append("temperature 23 to 25 degrees medium risk monitoring")
    else:
        terms.append("temperature below 23 degrees low risk cool conditions")

    base = f"{risk} white root rot cinnamon prevention management"
    return f"{base} {' '.join(terms)}"


def _generate_report(ph, moisture, temp, risk, confidence, results):
    """Generate the human-readable advisory report."""
    risk_meta = {
        "low":      ("LOW RISK",      "Conditions are favorable. Continue regular monitoring."),
        "moderate": ("MODERATE RISK", "Early warning signs detected. Take preventive action."),
        "high":     ("HIGH RISK",     "Favorable conditions for White Root Rot. Act now."),
        "critical": ("CRITICAL RISK", "URGENT: Critical conditions for White Root Rot. Immediate intervention required.")
    }
    status, message = risk_meta.get(risk, ("UNKNOWN", "Risk level not recognized."))

    # Condition labels
    ph_label = "Optimal (5.5-6.5)" if 5.5 <= ph <= 6.5 else "Suboptimal"
    moist_label = ("Critical (>60%)" if moisture > 60 else
                   "High (45-60%)" if moisture >= 45 else
                   "Medium (30-45%)" if moisture >= 30 else "Low (<30%)")
    temp_label = ("Critical (>30°C)" if temp > 30 else
                  "High (25-30°C)" if temp >= 25 else
                  "Medium (23-28°C)" if temp >= 23 else "Low (<23°C)")

    report = f"""
{'='*72}
  CINNAMON WHITE ROOT ROT — INTELLIGENT ADVISORY REPORT
{'='*72}

RISK ASSESSMENT : {status}
ADVISORY        : {message}

INPUT CONDITIONS
  Soil pH          : {ph}        [{ph_label}]
  Soil Moisture    : {moisture}%       [{moist_label}]
  Temperature      : {temp}°C       [{temp_label}]
  Model Confidence : {confidence*100:.1f}%

KNOWLEDGE BASE INSIGHTS (Top Retrieved Passages):
"""
    for i, doc in enumerate(results["documents"][0], 1):
        clean = doc.replace("\n", " ").strip()
        report += f"\n  [{i}] {clean[:240]}...\n"

    report += f"\n{'='*72}"
    return report


def _get_immediate_actions(risk: str, ph: float, moisture: float, temp: float):
    """Condition-specific immediate actions from your KB."""
    actions = []

    if risk == "critical":
        actions.extend([
            "STOP irrigation immediately to reduce soil saturation",
            "Dig contour drains urgently to remove excess water from root zones",
            "Apply approved fungicide treatment (copper-based per DOA list 2019)",
            "Consult an agricultural officer from the Department of Export Agriculture",
            "Consider removing severely infected plants to prevent spread to neighboring bushes"
        ])
    elif risk == "high":
        actions.extend([
            "Improve field drainage immediately to prevent waterlogging",
            "Reduce irrigation frequency and allow soil surface to dry between waterings",
            "Apply preventive fungicide (copper-based fungicide per DOA recommendations)",
            "Increase plant spacing or prune side branches to improve air circulation",
            "Inspect root zones for white fungal threads, bark cankers, or brown necrosis"
        ])
    elif risk == "moderate":
        actions.extend([
            "Improve field drainage to prevent future waterlogging",
            "Reduce irrigation frequency slightly",
            "Monitor plants closely for leaf yellowing, wilting, or bark peeling",
            "Apply dolomite at 1000 kg/ha/yr if pH is below 5.5 to raise toward optimal range"
        ])
    else:  # low
        actions.extend([
            "Continue regular monitoring and maintain good drainage",
            "Apply fertilizer mixture (Urea 2 parts + Rock phosphate 1 part) per DOA recommendations",
            "Ensure proper spacing (4ft between rows, 3ft within rows) and regular pruning",
            "Maintain soil pH between 5.5 and 6.5 through periodic testing"
        ])

    # Mandatory condition-specific injections (safety rules)
    if moisture > 60:
        actions.insert(0, "CRITICAL: Soil moisture is dangerously high. Stop all irrigation NOW.")
    if ph < 5.5:
        actions.append("Apply dolomite at 1000 kg/ha/yr to raise pH toward optimal 5.5-6.5 range")
    if ph > 6.5:
        actions.append("Soil pH is above optimal. Consider sulfur amendment or acidifying fertilizer")
    if temp > 30:
        actions.append("High temperature stress detected. Apply mulch to regulate soil temperature")

    return actions


def _get_preventive_measures():
    """Long-term preventive measures from your KB."""
    return [
        "Maintain ideal soil pH between 5.5 and 6.5 (test every 3 months)",
        "Ensure proper drainage with contour drains on sloped land",
        "Apply DOA recommended fertilizer: Urea 2 parts + Rock phosphate 1 part",
        "Mulch with pruned branches and weeds to regulate soil moisture",
        "Expose rootstocks to sunlight to encourage tillering and reduce fungal growth",
        "Use disease-free planting material from certified mother plants",
        "Practice intercropping with coconut (avoid land previously used for rubber)",
        "Remove and destroy infected plant material immediately — do not compost",
        "Monitor soil moisture, pH, and temperature continuously using sensors",
        "Maintain proper spacing (4ft x 3ft) for air circulation and sunlight penetration"
    ]


def _get_monitoring_plan(risk: str):
    plans = {
        "critical": ("Daily inspection for 2 weeks, then every 3 days for 1 month. "
                     "Check soil moisture and drainage after every rainfall."),
        "high":     ("Inspect every 3 days for 1 month, then weekly for 2 months. "
                     "Focus on leaf yellowing and root zone inspection."),
        "moderate": ("Bi-weekly inspection for 2 months, then return to monthly schedule. "
                     "Monitor for early symptom development."),
        "low":      "Monthly routine monitoring. Record environmental conditions and plant health."
    }
    return plans.get(risk, "Monthly routine monitoring")


def _get_disclaimer(confidence: float):
    if confidence < 0.6:
        return ("WARNING: Low model confidence. This advisory should be verified by a field "
                "agronomist before any action is taken.")
    elif confidence < 0.8:
        return ("NOTE: Moderate confidence. Consider additional diagnostic tests "
                "(soil pathology lab test) for confirmation.")
    return "High confidence prediction. Advisory is based on reliable ML output and KB retrieval."