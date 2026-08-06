"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  Statistic,
  Progress,
  Badge,
  Spin,
  message,
  ConfigProvider,
  Button,
  Row,
  Col,
} from "antd";
import { getHealthMetrics } from "@/app/api/constant";
import mnMN from "antd/lib/locale/mn_MN";
import { LoadingOutlined, ReloadOutlined } from "@ant-design/icons";
import { DatabaseBoldDuotone } from "solar-icons";

const fmtTime = (iso) => {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleTimeString("mn-MN", { hour12: false });
};

const StatusBadge = ({ ok, note }) => {
  if (ok === null || ok === undefined) {
    return <Badge status="default" text={note || "Хяналтгүй"} />;
  }
  return ok ? (
    <Badge status="success" text="Ажиллаж байна" />
  ) : (
    <Badge status="error" text="Хариу өгөхгүй байна" />
  );
};

const progressColor = (percent) => {
  if (percent >= 90) return "#ff4d4f";
  if (percent >= 75) return "#faad14";
  return "#52c41a";
};

const SystemHealth = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState(null);
  const [messageApi, contextHolder] = message.useMessage();

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const response = await getHealthMetrics();
      if (response.success) {
        setData(response.data);
      } else {
        messageApi.error(response.message || "Алдаа гарлаа.");
      }
    } catch (error) {
      console.error("Error fetching health metrics:", error);
      messageApi.error("Сервертэй холбогдоход алдаа гарлаа.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [messageApi]);

  useEffect(() => {
    fetchData(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading && !data) {
    return (
      <ConfigProvider locale={mnMN}>
        <div className="flex justify-center items-center h-64">
          <Spin
            size="large"
            indicator={
              <LoadingOutlined style={{ color: "#f26522", fontSize: 32 }} spin />
            }
          />
        </div>
      </ConfigProvider>
    );
  }

  const system = data?.system || {};
  const disk = data?.disk || {};
  const proc = data?.process || {};
  const db = data?.db || {};
  const redis = data?.redis || {};
  const services = data?.services || {};
  const app = data?.app || {};

  return (
    <ConfigProvider locale={mnMN}>
      {contextHolder}
      <div className="px-5 py-6">
        <div className="flex justify-between items-center mb-4">
          <div className="text-base font-bold flex items-center gap-2">
            <DatabaseBoldDuotone className="text-main" />
            Ачаалал / Health
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">
              Шинэчлэгдсэн: {fmtTime(data?.ts)}
            </span>
            <Button
              size="small"
              icon={<ReloadOutlined />}
              loading={refreshing}
              onClick={() => fetchData(true)}
            >
              Шинэчлэх
            </Button>
          </div>
        </div>

        <Row gutter={[16, 16]}>
          {/* CPU / RAM */}
          <Col xs={24} md={12} xl={8}>
            <Card title="Сервер (CPU / RAM)" size="small">
              <div className="mb-3 text-sm text-gray-500">
                Load average: {(system.loadavg || []).join(" / ")} · CPU:{" "}
                {system.cpuCount ?? "-"}
              </div>
              <div className="mb-1 text-sm">
                RAM ашиглалт ({system.memTotalMb ?? "-"} MB нийт)
              </div>
              <Progress
                percent={system.memUsedPercent ?? 0}
                strokeColor={progressColor(system.memUsedPercent ?? 0)}
              />
              <div className="text-xs text-gray-400 mt-1">
                Чөлөөтэй: {system.memFreeMb ?? "-"} MB
              </div>
            </Card>
          </Col>

          {/* Disk */}
          <Col xs={24} md={12} xl={8}>
            <Card title="Диск" size="small">
              {disk.error ? (
                <div className="text-red-500 text-sm">{disk.error}</div>
              ) : (
                <>
                  <Progress
                    percent={disk.usedPercent ?? 0}
                    strokeColor={progressColor(disk.usedPercent ?? 0)}
                  />
                  <div className="text-xs text-gray-400 mt-1">
                    {disk.usedGb ?? "-"} GB / {disk.sizeGb ?? "-"} GB ашигласан
                    (сул: {disk.availGb ?? "-"} GB)
                  </div>
                </>
              )}
            </Card>
          </Col>

          {/* Process */}
          <Col xs={24} md={12} xl={8}>
            <Card title="Core процесс" size="small">
              <Row gutter={8}>
                <Col span={12}>
                  <Statistic
                    title="Ажилласан хугацаа"
                    value={
                      proc.uptimeSec ? Math.round(proc.uptimeSec / 3600) : 0
                    }
                    suffix="цаг"
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="RAM (RSS)"
                    value={proc.rssMb ?? 0}
                    suffix="MB"
                  />
                </Col>
              </Row>
            </Card>
          </Col>

          {/* DB */}
          <Col xs={24} md={12} xl={8}>
            <Card title="Postgres" size="small">
              <StatusBadge ok={db.ok} />
              {db.ok && (
                <div className="text-xs text-gray-400 mt-2">
                  Ping: {db.latencyMs}ms
                  {db.pool && (
                    <>
                      {" "}
                      · Pool: {db.pool.total ?? "-"} нийт /{" "}
                      {db.pool.idle ?? "-"} idle / {db.pool.waiting ?? "-"}{" "}
                      хүлээж буй
                    </>
                  )}
                </div>
              )}
              {db.error && (
                <div className="text-xs text-red-500 mt-2">{db.error}</div>
              )}
            </Card>
          </Col>

          {/* Redis */}
          <Col xs={24} md={12} xl={8}>
            <Card title="Redis" size="small">
              <StatusBadge ok={redis.ok} />
              {redis.ok && (
                <div className="text-xs text-gray-400 mt-2">
                  Ping: {redis.latencyMs}ms · Санах ой:{" "}
                  {redis.usedMemoryHuman ?? "-"} · Клиент:{" "}
                  {redis.connectedClients ?? "-"}
                </div>
              )}
              {redis.error && (
                <div className="text-xs text-red-500 mt-2">{redis.error}</div>
              )}
            </Card>
          </Col>

          {/* Services */}
          <Col xs={24} md={12} xl={8}>
            <Card title="Сервисүүд" size="small">
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between items-center">
                  <span>Core</span>
                  <StatusBadge ok={services.core?.ok} />
                </div>
                <div className="flex justify-between items-center">
                  <span>Web</span>
                  <StatusBadge ok={services.web?.ok} />
                </div>
                <div className="flex justify-between items-center">
                  <span>Admin</span>
                  <StatusBadge ok={services.admin?.ok} />
                </div>
                <div className="flex justify-between items-center">
                  <span>Report</span>
                  <StatusBadge
                    ok={services.report?.ok}
                    note={services.report?.note}
                  />
                </div>
              </div>
            </Card>
          </Col>

          {/* App load */}
          <Col xs={24}>
            <Card title="App ачаалал" size="small">
              <Row gutter={16}>
                <Col xs={12} md={6}>
                  <Statistic
                    title="Хүсэлт (сүүлийн 5 мин)"
                    value={app.requestsLast5Min ?? 0}
                  />
                </Col>
                <Col xs={12} md={6}>
                  <Statistic
                    title="Дундаж хариу хугацаа (5 мин)"
                    value={app.avgResponseMsLast5Min ?? 0}
                    suffix="ms"
                  />
                </Col>
                <Col xs={12} md={6}>
                  <Statistic
                    title="Алдаа (сүүлийн 1 цаг)"
                    value={app.errorsLast1h ?? 0}
                    valueStyle={
                      app.errorsLast1h > 0 ? { color: "#faad14" } : undefined
                    }
                  />
                </Col>
                <Col xs={12} md={6}>
                  <Statistic
                    title="Алдаа (сүүлийн 24 цаг)"
                    value={app.errorsLast24h ?? 0}
                    valueStyle={
                      app.errorsLast24h > 0 ? { color: "#faad14" } : undefined
                    }
                  />
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </div>
    </ConfigProvider>
  );
};

export default SystemHealth;
