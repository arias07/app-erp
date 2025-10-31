import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import { Button, Modal, Text, IconButton } from 'react-native-paper';
import dayjs, { Dayjs } from 'dayjs';

interface CalendarPickerModalProps {
  visible: boolean;
  initialDate?: string;
  onDismiss: () => void;
  onConfirm: (value: string) => void;
  onClear?: () => void;
  title?: string;
}

const weekDays = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

export const CalendarPickerModal: React.FC<CalendarPickerModalProps> = ({
  visible,
  initialDate,
  onDismiss,
  onConfirm,
  onClear,
  title,
}) => {
  const fallbackDate = useMemo(() => (initialDate ? dayjs(initialDate) : dayjs()), [initialDate]);
  const [currentMonth, setCurrentMonth] = useState<Dayjs>(fallbackDate.startOf('month'));
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(
    initialDate ? fallbackDate : null
  );

  useEffect(() => {
    if (visible) {
      const base = initialDate ? dayjs(initialDate) : dayjs();
      setCurrentMonth(base.startOf('month'));
      setSelectedDate(initialDate ? base : null);
    }
  }, [visible, initialDate]);

  const handleSelectDay = (day: number) => {
    const date = currentMonth.date(day);
    setSelectedDate(date);
  };

  const handleConfirm = () => {
    if (selectedDate) {
      onConfirm(selectedDate.format('YYYY-MM-DD'));
    }
    onDismiss();
  };

  const handleClear = () => {
    if (onClear) {
      onClear();
    }
    onDismiss();
  };

  const leadingEmptyDays = useMemo(() => {
    const index = currentMonth.day();
    return (index + 6) % 7;
  }, [currentMonth]);

  const daysInMonth = currentMonth.daysInMonth();
  const today = dayjs();

  const rows = useMemo(() => {
    const cells: Array<Dayjs | null> = [];
    for (let i = 0; i < leadingEmptyDays; i += 1) {
      cells.push(null);
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push(currentMonth.date(day));
    }

    const chunks: Array<Array<Dayjs | null>> = [];
    for (let i = 0; i < cells.length; i += 7) {
      chunks.push(cells.slice(i, i + 7));
    }
    return chunks;
  }, [currentMonth, leadingEmptyDays, daysInMonth]);

  return (
    <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.modal}>
      <View style={styles.header}>
        <IconButton
          icon="chevron-left"
          onPress={() => setCurrentMonth((prev) => prev.subtract(1, 'month'))}
          accessibilityLabel="Mes anterior"
        />
        <View style={styles.headerTextContainer}>
          {title ? (
            <Text variant="titleMedium" style={styles.title}>
              {title}
            </Text>
          ) : null}
          <Text variant="titleMedium" style={styles.headerText}>
            {currentMonth.format('MMMM YYYY')}
          </Text>
        </View>
        <IconButton
          icon="chevron-right"
          onPress={() => setCurrentMonth((prev) => prev.add(1, 'month'))}
          accessibilityLabel="Mes siguiente"
        />
      </View>

      <View style={styles.weekRow}>
        {weekDays.map((day) => (
          <Text key={day} style={styles.weekDayLabel}>
            {day}
          </Text>
        ))}
      </View>

      <View>
        {rows.map((week, index) => (
          <View key={`week-${index}`} style={styles.weekRow}>
            {week.map((date, idx) => {
              if (!date) {
                return <View key={`empty-${idx}`} style={styles.dayPlaceholder} />;
              }

              const isSelected = selectedDate ? date.isSame(selectedDate, 'day') : false;
              const isToday = date.isSame(today, 'day');

              return (
                <Pressable
                  key={date.format('YYYY-MM-DD')}
                  style={[
                    styles.day,
                    isToday && styles.dayToday,
                    isSelected && styles.daySelected,
                  ]}
                  onPress={() => handleSelectDay(date.date())}
                  accessibilityRole="button"
                  accessibilityLabel={`Seleccionar ${date.format('DD [de] MMMM')}`}
                >
                  <Text style={[styles.dayLabel, isSelected && styles.dayLabelSelected]}>
                    {date.date()}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        {onClear && (
          <Button onPress={handleClear} disabled={!selectedDate && !initialDate}>
            Limpiar
          </Button>
        )}
        <View style={styles.actionsRight}>
          <Button onPress={onDismiss} style={styles.actionButton}>
            Cancelar
          </Button>
          <Button
            mode="contained"
            onPress={handleConfirm}
            disabled={!selectedDate}
            style={styles.actionButton}
          >
            Confirmar
          </Button>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: {
    margin: 24,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerText: {
    textTransform: 'capitalize',
  },
  title: {
    fontWeight: '600',
    marginBottom: 4,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  weekDayLabel: {
    width: 40,
    textAlign: 'center',
    fontWeight: '600',
    color: '#555',
  },
  day: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  dayPlaceholder: {
    width: 40,
    height: 40,
    marginBottom: 6,
  },
  dayToday: {
    borderWidth: 1,
    borderColor: '#6200ee',
  },
  daySelected: {
    backgroundColor: '#6200ee',
  },
  dayLabel: {
    fontWeight: '600',
    color: '#333',
  },
  dayLabelSelected: {
    color: '#fff',
  },
  actions: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    marginLeft: 8,
  },
});

export default CalendarPickerModal;
