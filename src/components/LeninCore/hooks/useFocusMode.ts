// Focus mode management hook
import { useState, useCallback, useMemo } from 'react';
import { WidgetData, ConnectionData } from '../types';

export interface FocusState {
  hoveredWidgetId: string | null;
  selectedWidgetId: string | null;
  focusedWidgetId: string | null;
  relatedWidgetIds: Set<string>;
  highlightedConnectionIds: Set<string>;
}

export const useFocusMode = (
  widgets: WidgetData[],
  connections: ConnectionData[]
) => {
  const [hoveredWidgetId, setHoveredWidgetId] = useState<string | null>(null);
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);

  // The active focus is selected if available, otherwise hovered
  const focusedWidgetId = selectedWidgetId || hoveredWidgetId;

  // Calculate related widgets and connections
  const { relatedWidgetIds, highlightedConnectionIds } = useMemo(() => {
    if (!focusedWidgetId) {
      return {
        relatedWidgetIds: new Set<string>(),
        highlightedConnectionIds: new Set<string>(),
      };
    }

    const related = new Set<string>();
    const highlighted = new Set<string>();

    // Find the focused widget
    const focusedWidget = widgets.find((w) => w.id === focusedWidgetId);
    if (focusedWidget) {
      // Add directly connected widgets from widget's connects array
      focusedWidget.connects.forEach((id) => related.add(id));
    }

    // Find connections involving the focused widget
    connections.forEach((conn) => {
      if (conn.from === focusedWidgetId || conn.to === focusedWidgetId) {
        highlighted.add(conn.id);
        related.add(conn.from);
        related.add(conn.to);
      }
    });

    // Remove the focused widget itself from related
    related.delete(focusedWidgetId);

    return { relatedWidgetIds: related, highlightedConnectionIds: highlighted };
  }, [focusedWidgetId, widgets, connections]);

  const handleWidgetHover = useCallback((widgetId: string | null) => {
    setHoveredWidgetId(widgetId);
  }, []);

  const handleWidgetSelect = useCallback((widgetId: string | null) => {
    setSelectedWidgetId((prev) => (prev === widgetId ? null : widgetId));
  }, []);

  const isWidgetFocused = useCallback(
    (widgetId: string) => widgetId === focusedWidgetId,
    [focusedWidgetId]
  );

  const isWidgetRelated = useCallback(
    (widgetId: string) => relatedWidgetIds.has(widgetId),
    [relatedWidgetIds]
  );

  const isWidgetBlurred = useCallback(
    (widgetId: string) => {
      if (!focusedWidgetId) return false;
      return !isWidgetFocused(widgetId) && !isWidgetRelated(widgetId);
    },
    [focusedWidgetId, isWidgetFocused, isWidgetRelated]
  );

  const isConnectionHighlighted = useCallback(
    (connectionId: string) => highlightedConnectionIds.has(connectionId),
    [highlightedConnectionIds]
  );

  const focusState: FocusState = {
    hoveredWidgetId,
    selectedWidgetId,
    focusedWidgetId,
    relatedWidgetIds,
    highlightedConnectionIds,
  };

  return {
    focusState,
    handleWidgetHover,
    handleWidgetSelect,
    isWidgetFocused,
    isWidgetRelated,
    isWidgetBlurred,
    isConnectionHighlighted,
  };
};
