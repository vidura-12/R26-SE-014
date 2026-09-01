export default function useAdvisory(advisory) {
  return {
    inputConditions:
      advisory?.input_conditions || {},

    immediateActions:
      advisory?.immediate_actions || [],

    preventiveMeasures:
      advisory?.preventive_measures || [],

    monitoringPlan:
      advisory?.monitoring_plan || "",

    knowledgeSources:
      advisory?.sources || [],

    retrievedPassages:
      advisory?.retrieved_passages || [],

    report:
      advisory?.report || "",

    disclaimer:
      advisory?.disclaimer || "",
  };
}