import {createAdaptiveStyles} from '../theme';
import React, {useMemo} from 'react';
import {StyleSheet, Text, View, useWindowDimensions} from 'react-native';

export interface SkillRadarPoint {
  subjectId: string;
  subjectName: string;
  score: number;
  completed: number;
  total: number;
}

interface Props {
  data: SkillRadarPoint[];
}

const COLORS = ['#16794b', '#e08a24', '#298a67', '#8a5be0', '#d04f76', '#18899c'];

/** A dependency-free, accessible radar plot sized for narrow phone screens. */
export function SkillRadarChart({data}: Props): React.JSX.Element {
  const {width: windowWidth} = useWindowDimensions();
  const size = Math.min(284, Math.max(232, windowWidth - 72));
  const center = size / 2;
  const radius = size * 0.271;
  const labelRadius = size * 0.398;
  const labelWidth = size * 0.275;

  const points = useMemo(() => data.slice(0, 6).map((item, index, list) => {
    const angle = -Math.PI / 2 + (2 * Math.PI * index) / list.length;
    const score = Math.max(0, Math.min(100, Number(item.score) || 0));
    const distance = radius * score / 100;
    return {
      ...item,
      color: COLORS[index % COLORS.length],
      x: center + Math.cos(angle) * distance,
      y: center + Math.sin(angle) * distance,
      axisX: center + Math.cos(angle) * radius,
      axisY: center + Math.sin(angle) * radius,
      labelX: center + Math.cos(angle) * labelRadius,
      labelY: center + Math.sin(angle) * labelRadius,
    };
  }), [center, data, labelRadius, radius]);

  const edges = useMemo(() => points.map((point, index) => {
    const next = points[(index + 1) % points.length];
    if (!next || points.length < 2) return null;
    const deltaX = next.x - point.x;
    const deltaY = next.y - point.y;
    const length = Math.hypot(deltaX, deltaY);
    const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
    return {
      key: `${point.subjectId}:${next.subjectId}`,
      left: (point.x + next.x - length) / 2,
      top: (point.y + next.y) / 2 - 1,
      length,
      angle,
      color: point.color,
    };
  }).filter((edge): edge is NonNullable<typeof edge> => edge !== null), [points]);

  if (!data.length) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>Career chart is ready to grow</Text>
        <Text style={styles.emptyCopy}>Mark interview questions understood or coding problems solved to build your subject skill profile.</Text>
      </View>
    );
  }

  return (
    <View>
      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel={`Career skill radar. ${points.map(point => `${point.subjectName}: ${point.score} percent from ${point.completed} of ${point.total} completed`).join('. ')}`}>
        <View style={[styles.plot, {width: size, height: size}]}>
          {[1, 0.75, 0.5, 0.25].map(scale => (
            <View key={scale} style={[styles.ring, {width: radius * 2 * scale, height: radius * 2 * scale, left: center - radius * scale, top: center - radius * scale}]} />
          ))}
          {points.map(point => {
            const dx = point.axisX - center;
            const dy = point.axisY - center;
            const length = Math.hypot(dx, dy);
            return <View key={`axis:${point.subjectId}`} style={[styles.axis, {left: center - 0.5, top: center, width: length, transform: [{rotate: `${Math.atan2(dy, dx)}rad`}]}]} />;
          })}
          {edges.map(edge => (
            <View key={edge.key} style={[styles.edge, {left: edge.left, top: edge.top, width: edge.length, backgroundColor: edge.color, transform: [{rotate: `${edge.angle}deg`}]}]} />
          ))}
          {points.map(point => (
            <View key={`point:${point.subjectId}`} style={[styles.point, {left: point.x - 5, top: point.y - 5, borderColor: point.color}]} />
          ))}
          {points.map(point => (
            <View key={`label:${point.subjectId}`} style={[styles.label, {width: labelWidth, left: Math.max(0, Math.min(size - labelWidth, point.labelX - labelWidth / 2)), top: point.labelY - 12}]}>
              <Text numberOfLines={2} style={styles.labelText}>{point.subjectName}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={styles.legend}>
        {points.map(point => (
          <View key={`legend:${point.subjectId}`} style={styles.legendRow}>
            <View style={[styles.swatch, {backgroundColor: point.color}]} />
            <Text numberOfLines={1} style={styles.legendName}>{point.subjectName}</Text>
            <Text style={styles.legendScore}>{point.score}%</Text>
          </View>
        ))}
      </View>
      {data.length > points.length ? <Text style={styles.note}>Showing the first {points.length} subjects. Open Progress for the full breakdown.</Text> : null}
    </View>
  );
}

const styles = createAdaptiveStyles(StyleSheet.create({
  plot: {alignSelf: 'center'},
  ring: {position: 'absolute', borderWidth: 1, borderColor: '#e3e8f2', borderRadius: 999},
  axis: {position: 'absolute', height: 1, backgroundColor: '#e1e6ef', transformOrigin: 'left center'},
  edge: {position: 'absolute', height: 2, opacity: 0.85, transformOrigin: 'left center'},
  point: {position: 'absolute', width: 10, height: 10, borderWidth: 2, borderRadius: 5, backgroundColor: '#fff'},
  label: {position: 'absolute', minHeight: 26, alignItems: 'center', justifyContent: 'center'},
  labelText: {color: '#4d586d', fontSize: 9, lineHeight: 12, fontWeight: '800', textAlign: 'center'},
  legend: {marginTop: 4, gap: 8},
  legendRow: {flexDirection: 'row', alignItems: 'center', gap: 8},
  swatch: {width: 9, height: 9, borderRadius: 5},
  legendName: {flex: 1, color: '#596478', fontSize: 11, fontWeight: '700'},
  legendScore: {color: '#182033', fontSize: 11, fontWeight: '900'},
  empty: {padding: 14, borderWidth: 1, borderStyle: 'dashed', borderColor: '#d7deeb', borderRadius: 13, backgroundColor: '#fbfcff'},
  emptyTitle: {color: '#182033', fontSize: 13, fontWeight: '900'},
  emptyCopy: {marginTop: 5, color: '#687187', fontSize: 11, lineHeight: 17},
  note: {marginTop: 8, color: '#737b8c', fontSize: 10, lineHeight: 15},
}));
