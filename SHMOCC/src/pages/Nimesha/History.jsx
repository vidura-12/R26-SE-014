import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem("cinnamonToken");

      const response = await fetch("http://localhost:9000/history", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      setHistory(data);
    } catch (err) {
      console.log(err);
    }

    setLoading(false);
  };

  if (loading) {
    return <h2 className="text-center mt-10">Loading...</h2>;
  }

  if (history.length === 0) {
    return <h2 className="text-center mt-10">No detections found.</h2>;
  }

  return (
    <div className="max-w-5xl mx-auto p-8">

      <h1 className="text-3xl font-bold mb-8">
        Detection History
      </h1>
      <button
        onClick={() => navigate("/cinnamon")}
        className="mb-6 px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
        >
        ← Back to Detection
      </button>

      <div className="grid gap-6">

        {history.map((item) => (

          <div
            key={item._id}
            className="border rounded-xl p-5 shadow cursor-pointer hover:bg-gray-50 transition"
            onClick={() => setSelected(item)}
          >

            <img
              src={`http://localhost:9000/${item.image}`}
              alt=""
              className="w-48 rounded mb-4"
            />

            <p>
              <strong>Grade:</strong> {item.final_grade}
            </p>

            <p>
              <strong>Status:</strong> {item.status}
            </p>

            <p>
              <strong>Date:</strong>{" "}
              {new Date(item.createdAt).toLocaleString()}
            </p>

          </div>

        ))}

      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">

          <div className="bg-white rounded-2xl shadow-xl p-8 w-[900px] max-w-[95vw] max-h-[90vh] overflow-y-auto">

            <h2 className="text-3xl font-bold mb-6">
              Detection Details
            </h2>

            <img
              src={`http://localhost:9000/${selected.image}`}
              alt=""
              className="w-72 rounded-xl mb-6 border"
            />

            <div className="grid md:grid-cols-3 gap-4 mb-6">

              <div className="border rounded-xl p-4">
                <h3 className="font-semibold text-gray-500">
                  Grade
                </h3>
                <p className="text-xl font-bold">
                  {selected.final_grade}
                </p>
              </div>

              <div className="border rounded-xl p-4">
                <h3 className="font-semibold text-gray-500">
                  Status
                </h3>
                <p className="text-xl font-bold">
                  {selected.status}
                </p>
              </div>

              <div className="border rounded-xl p-4">
                <h3 className="font-semibold text-gray-500">
                  Detection Date
                </h3>
                <p>
                  {new Date(selected.createdAt).toLocaleString()}
                </p>
              </div>

            </div>

            <h3 className="text-xl font-bold mb-3">
              Grade Counts
            </h3>

            <div className="grid md:grid-cols-3 gap-3 mb-8">

              {selected.details &&
                Object.entries(selected.details).map(([key, value]) => (
                  <div
                    key={key}
                    className="border rounded-xl p-3 bg-gray-50"
                  >
                    <p className="font-semibold">{key}</p>
                    <p className="text-lg">{String(value)}</p>
                  </div>
                ))}

            </div>

            {selected.market_price_forecast && (
              <>
                <h3 className="text-xl font-bold mb-4">
                  Market Price Forecast
                </h3>

                <div className="grid md:grid-cols-3 gap-4">

                  {/* This Week */}
                  <div className="rounded-xl border bg-green-50 p-4">

                    <h4 className="font-bold text-green-700 mb-3">
                      This Week
                    </h4>

                    <p>
                      <strong>Best Market:</strong>{" "}
                      {selected.market_price_forecast.this_week.best_market.district}
                    </p>

                    <p>
                      <strong>Predicted Price:</strong><br />
                      LKR{" "}
                      {selected.market_price_forecast.this_week.best_market.predicted_price.toFixed(
                        2
                      )}
                      /kg
                    </p>

                    <p className="mt-3 text-sm text-gray-700">
                      {
                        selected.market_price_forecast.this_week
                          .recommendation
                      }
                    </p>

                  </div>

                  {/* Next Week */}
                  <div className="rounded-xl border bg-blue-50 p-4">

                    <h4 className="font-bold text-blue-700 mb-3">
                      Next Week
                    </h4>

                    <p>
                      <strong>Best Market:</strong>{" "}
                      {selected.market_price_forecast.next_week.best_market.district}
                    </p>

                    <p>
                      <strong>Predicted Price:</strong><br />
                      LKR{" "}
                      {selected.market_price_forecast.next_week.best_market.predicted_price.toFixed(
                        2
                      )}
                      /kg
                    </p>

                    <p className="mt-3 text-sm text-gray-700">
                      {
                        selected.market_price_forecast.next_week
                          .recommendation
                      }
                    </p>

                  </div>

                  {/* Next Month */}
                  <div className="rounded-xl border bg-orange-50 p-4">

                    <h4 className="font-bold text-orange-700 mb-3">
                      Next Month
                    </h4>

                    <p>
                      <strong>Best Market:</strong>{" "}
                      {selected.market_price_forecast.next_month.best_market.district}
                    </p>

                    <p>
                      <strong>Predicted Price:</strong><br />
                      LKR{" "}
                      {selected.market_price_forecast.next_month.best_market.predicted_price.toFixed(
                        2
                      )}
                      /kg
                    </p>

                    <p className="mt-3 text-sm text-gray-700">
                      {
                        selected.market_price_forecast.next_month
                          .recommendation
                      }
                    </p>

                  </div>

                </div>
              </>
            )}

            <div className="flex justify-end mt-8">

              <button
                onClick={() => setSelected(null)}
                className="px-6 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
              >
                Close
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}