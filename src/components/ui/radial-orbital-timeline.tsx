"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowRight, Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import kairoLogo from "@/assets/kairo-penguin.png";

interface TimelineItem {
  id: number;
  title: string;
  content: string;
  category: string;
  icon: React.ElementType;
  relatedIds: number[];
}

interface RadialOrbitalTimelineProps {
  timelineData: TimelineItem[];
}

export default function RadialOrbitalTimeline({
  timelineData,
}: RadialOrbitalTimelineProps) {
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({});
  const [rotationAngle, setRotationAngle] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const [pulseEffect, setPulseEffect] = useState<Record<number, boolean>>({});
  const [centerOffset] = useState({ x: 0, y: 0 });
  const [activeNodeId, setActiveNodeId] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const orbitRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const handleContainerClick = (e: React.MouseEvent) => {
    if (e.target === containerRef.current || e.target === orbitRef.current) {
      setExpandedItems({});
      setActiveNodeId(null);
      setPulseEffect({});
      setAutoRotate(true);
    }
  };

  const toggleItem = (id: number) => {
    setExpandedItems((prev) => {
      const newState = { ...prev };
      Object.keys(newState).forEach((key) => {
        if (parseInt(key) !== id) newState[parseInt(key)] = false;
      });
      newState[id] = !prev[id];

      if (!prev[id]) {
        setActiveNodeId(id);
        setAutoRotate(false);
        const related = getRelatedItems(id);
        const pulse: Record<number, boolean> = {};
        related.forEach((relId) => { pulse[relId] = true; });
        setPulseEffect(pulse);
        centerViewOnNode(id);
      } else {
        setActiveNodeId(null);
        setAutoRotate(true);
        setPulseEffect({});
      }
      return newState;
    });
  };

  useEffect(() => {
    let rafId: number;
    let lastTime = 0;
    if (autoRotate) {
      const animate = (time: number) => {
        if (lastTime) {
          const delta = time - lastTime;
          setRotationAngle((prev) => (prev + delta * 0.006) % 360);
        }
        lastTime = time;
        rafId = requestAnimationFrame(animate);
      };
      rafId = requestAnimationFrame(animate);
    }
    return () => { if (rafId) cancelAnimationFrame(rafId); };
  }, [autoRotate]);

  const centerViewOnNode = (nodeId: number) => {
    const idx = timelineData.findIndex((item) => item.id === nodeId);
    const targetAngle = (idx / timelineData.length) * 360;
    setRotationAngle(270 - targetAngle);
  };

  const calculateNodePosition = (index: number, total: number) => {
    const angle = ((index / total) * 360 + rotationAngle) % 360;
    const radius = 200;
    const radian = (angle * Math.PI) / 180;
    const x = radius * Math.cos(radian) + centerOffset.x;
    const y = radius * Math.sin(radian) + centerOffset.y;
    const zIndex = Math.round(100 + 50 * Math.cos(radian));
    const opacity = Math.max(0.4, Math.min(1, 0.4 + 0.6 * ((1 + Math.sin(radian)) / 2)));
    return { x, y, zIndex, opacity };
  };

  const getRelatedItems = (itemId: number): number[] => {
    const item = timelineData.find((i) => i.id === itemId);
    return item ? item.relatedIds : [];
  };

  const isRelatedToActive = (itemId: number): boolean => {
    if (!activeNodeId) return false;
    return getRelatedItems(activeNodeId).includes(itemId);
  };

  return (
    <div
      ref={containerRef}
      onClick={handleContainerClick}
      className="relative w-full flex items-center justify-center overflow-hidden"
      style={{ minHeight: "550px" }}
    >
      <div className="relative" style={{ width: "500px", height: "500px" }}>
        <div ref={orbitRef} className="absolute inset-0 flex items-center justify-center">
          {/* Orbit rings */}
          <div className="absolute w-[400px] h-[400px] rounded-full border border-border/20" />
          <div className="absolute w-[300px] h-[300px] rounded-full border border-border/10" />
          <div className="absolute w-[200px] h-[200px] rounded-full border border-border/10" />

          {/* Center logo */}
          <div className="absolute w-14 h-14 rounded-full overflow-hidden ring-2 ring-primary/30 shadow-lg shadow-primary/20 z-10">
            <img src={kairoLogo} alt="Kairo" className="w-full h-full object-cover" />
          </div>
          <div className="absolute w-16 h-16 rounded-full bg-primary/20 animate-ping" />

          {/* Nodes */}
          {timelineData.map((item, index) => {
            const position = calculateNodePosition(index, timelineData.length);
            const isExpanded = expandedItems[item.id];
            const isRelated = isRelatedToActive(item.id);
            const isPulsing = pulseEffect[item.id];
            const Icon = item.icon;

            const nodeStyle: React.CSSProperties = {
              transform: `translate(${position.x}px, ${position.y}px)`,
              zIndex: isExpanded ? 200 : position.zIndex,
              opacity: isExpanded ? 1 : position.opacity,
            };

            return (
              <div
                key={item.id}
                ref={(el) => (nodeRefs.current[item.id] = el)}
                className="absolute transition-all duration-700 cursor-pointer"
                style={nodeStyle}
                onClick={(e) => { e.stopPropagation(); toggleItem(item.id); }}
              >
                {isPulsing && (
                  <div className="absolute -inset-3 rounded-full border-2 border-primary/50 animate-ping" />
                )}

                <div
                  className={`relative flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ${
                    isExpanded
                      ? "scale-125 border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                      : isRelated
                      ? "scale-110 border-primary/70 bg-primary/20 text-primary"
                      : "border-border bg-card text-foreground hover:border-primary/50 hover:bg-card/80"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>

                <div
                  className={`absolute top-14 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-medium transition-all duration-300 ${
                    isExpanded ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {item.title}
                </div>

                {isExpanded && (
                  <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50">
                    <Card className="w-72 backdrop-blur-lg bg-card/95 border-border/50 shadow-2xl">
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                            <Icon className="w-4 h-4 text-primary" />
                          </span>
                          <CardTitle className="text-base">{item.title}</CardTitle>
                        </div>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">
                          {item.category}
                        </span>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-sm text-muted-foreground">{item.content}</p>

                        {item.relatedIds.length > 0 && (
                          <div className="pt-2 border-t border-border/50">
                            <div className="flex items-center gap-1 mb-2">
                              <Link className="w-3 h-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">Conexões</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {item.relatedIds.map((relatedId) => {
                                const relatedItem = timelineData.find((i) => i.id === relatedId);
                                return (
                                  <Button
                                    key={relatedId}
                                    variant="outline"
                                    size="sm"
                                    className="h-6 text-xs px-2"
                                    onClick={(e) => { e.stopPropagation(); toggleItem(relatedId); }}
                                  >
                                    {relatedItem?.title}
                                    <ArrowRight className="w-3 h-3 ml-1" />
                                  </Button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
