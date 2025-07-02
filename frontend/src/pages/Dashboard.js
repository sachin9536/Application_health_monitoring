import React, { useState, useEffect } from "react";
import {
  ServerIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import { apiService, dataUtils } from "../services/api";
import MetricCard from "../components/MetricCard";
import StatusBadge from "../components/StatusBadge";
import toast from "react-hot-toast";

const Dashboard = () => {
  const [data, setData] = useState({
    health: null,
    summary: null,
    performance: null,
    errorAnalysis: null,
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Fetch all dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [health, summary, performance, errorAnalysis] = await Promise.all([
        apiService.getHealth(),
        apiService.getSummary(),
        apiService.getPerformance(),
        apiService.getErrorAnalysis(),
      ]);

      setData({ health, summary, performance, errorAnalysis });
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Manual refresh
  const handleRefresh = () => {
    fetchDashboardData();
    toast.success("Dashboard refreshed");
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between bg-white/80 backdrop-blur-xs rounded-xl shadow-sm px-6 py-4 mb-4 border border-gray-100">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-1">
            Dashboard
          </h1>
          <p className="text-lg text-gray-600">
            System overview and key metrics
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-base text-gray-500">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="btn btn-primary shadow-md hover:scale-105 transition-transform"
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* System Status */}
      {data.health && (
        <div className="card mb-6">
          <div className="card-header flex items-center justify-between">
            <h2 className="card-title text-xl font-bold flex items-center">
              <span className="mr-2">System Status</span>
              <StatusBadge status={data.health.status} size="lg" />
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
            {Object.entries(data.health.components || {}).map(
              ([component, status]) => (
                <div
                  key={component}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 shadow-sm"
                >
                  <span className="font-medium capitalize text-gray-700 flex items-center">
                    <span
                      className="inline-block w-2 h-2 rounded-full mr-2"
                      style={{
                        backgroundColor:
                          status === "healthy"
                            ? "#22c55e"
                            : status === "warning"
                            ? "#f59e0b"
                            : "#ef4444",
                      }}
                    ></span>
                    {component}
                  </span>
                  <StatusBadge status={status} />
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Logs"
          value={data.summary?.summary?.total || 0}
          subtitle="All log entries"
          icon={DocumentTextIcon}
          color="primary"
          loading={loading}
        />

        <MetricCard
          title="Total Errors"
          value={data.summary?.summary?.errors || 0}
          subtitle="Error count"
          icon={ExclamationTriangleIcon}
          color="danger"
          loading={loading}
        />

        <MetricCard
          title="Success Rate"
          value={data.performance?.throughput?.success_rate || "0%"}
          subtitle="Request success"
          icon={ChartBarIcon}
          color="success"
          loading={loading}
        />

        <MetricCard
          title="Active Services"
          value={
            data.health?.components
              ? Object.keys(data.health.components).length
              : 0
          }
          subtitle="Running services"
          icon={ServerIcon}
          color="primary"
          loading={loading}
        />
      </div>

      {/* Performance Metrics */}
      {data.performance && (
        <div className="card mt-8">
          <div className="card-header flex items-center justify-between">
            <h2 className="card-title text-xl font-bold">
              Performance Metrics
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {dataUtils.formatDuration(
                  data.performance.latency_analysis?.average_ms / 1000
                )}
              </div>
              <div className="text-sm text-gray-500">Average Latency</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {dataUtils.formatDuration(
                  data.performance.latency_analysis?.p95_ms / 1000
                )}
              </div>
              <div className="text-sm text-gray-500">P95 Latency</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {data.performance.throughput?.total_requests || 0}
              </div>
              <div className="text-sm text-gray-500">Total Requests</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {data.performance.throughput?.error_rate || "0%"}
              </div>
              <div className="text-sm text-gray-500">Error Rate</div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Anomalies */}
      {data.summary?.anomalies && data.summary.anomalies.length > 0 && (
        <div className="card mt-8">
          <div className="card-header flex items-center justify-between">
            <h2 className="card-title text-xl font-bold flex items-center">
              <ExclamationTriangleIcon className="w-5 h-5 text-warning-600 mr-2" />
              Recent Anomalies
            </h2>
            <StatusBadge status="warning" />
          </div>

          <div className="space-y-3 mt-2">
            {data.summary.anomalies.slice(0, 5).map((anomaly, index) => (
              <div
                key={index}
                className="flex items-start space-x-3 p-3 bg-warning-50 rounded-lg border border-warning-200 shadow-sm"
              >
                <ExclamationTriangleIcon className="w-5 h-5 text-warning-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-warning-800">
                    {anomaly}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Summary */}
      {data.errorAnalysis && (
        <div className="card mt-8">
          <div className="card-header flex items-center justify-between">
            <h2 className="card-title text-xl font-bold">Error Analysis</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Error Types
              </h3>
              <div className="space-y-2">
                {Object.entries(
                  data.errorAnalysis.error_summary?.error_types || {}
                ).map(([type, count]) => (
                  <div key={type} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 capitalize">
                      {type.replace("_", " ")}
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Service Errors
              </h3>
              <div className="space-y-2">
                {Object.entries(data.errorAnalysis.service_errors || {}).map(
                  ([service, count]) => (
                    <div
                      key={service}
                      className="flex justify-between items-center"
                    >
                      <span className="text-sm text-gray-600 capitalize">
                        {service.replace("_", " ")}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {count}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
