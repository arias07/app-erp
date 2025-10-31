
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { ActivityIndicator, Card, Text, Button } from 'react-native-paper';
import { useSelector } from 'react-redux';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { RootState } from '../store/store';
import dayjs from 'dayjs';
import { bitacoraService } from '../services/bitacora.service';
import {
  BitacoraConcepto,
  BitacoraSerieDato,
  BitacoraVariable,
} from '../types/bitacora.types';
import { LineChart } from 'react-native-chart-kit';

const HomeScreen = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [conceptos, setConceptos] = useState<BitacoraConcepto[]>([]);
  const [selectedConcept, setSelectedConcept] = useState<BitacoraConcepto | null>(null);
  const [selectedPuntoId, setSelectedPuntoId] = useState<string | null>(null);
  const [selectedVariableId, setSelectedVariableId] = useState<string | null>(null);
  const [serie, setSerie] = useState<BitacoraSerieDato[]>([]);
  const [serieLoading, setSerieLoading] = useState(false);

  const chartWidth = useMemo(() => Dimensions.get('window').width - 64, []);

  const activeConceptId = selectedConcept ? selectedConcept.id ?? selectedConcept.codigo : null;

  const resolvePointId = (punto: any): string | null => {
    return punto?.id ?? punto?.slug ?? punto?.nombre ?? null;
  };

  const resolveVariableId = (variable: any): string | null => {
    return variable?.id ?? variable?.slug ?? variable?.nombre ?? null;
  };

  const getRoleGreeting = (rol: string) => {
    const greetings: Record<string, string> = {
      superadmin: '¡Bienvenido, Super Administrador!',
      administrador: '¡Bienvenido, Administrador!',
      supervisor: '¡Bienvenido, Supervisor!',
      empleado: '¡Bienvenido, Colaborador!',
      proveedor: '¡Bienvenido, Proveedor!',
      own: '¡Bienvenido!',
    };
    return greetings[rol] || '¡Bienvenido!';
  };

  const loadConceptos = useCallback(async () => {
    try {
      const data = await bitacoraService.getConceptos();
      setConceptos(data);
      if (data.length > 0) {
        const conceptoDefault = data[0];
        setSelectedConcept(conceptoDefault);
        setSelectedPuntoId(resolvePointId(conceptoDefault.puntos_medicion[0]));
        setSelectedVariableId(resolveVariableId(conceptoDefault.variables[0]));
      }
    } catch (err) {
      console.error('Error fetching bitacora conceptos', err);
    }
  }, []);

  const loadSerie = useCallback(async () => {
    if (!selectedConcept || !selectedPuntoId || !selectedVariableId) {
      setSerie([]);
      return;
    }

    try {
      const conceptoRef = selectedConcept.id ?? selectedConcept.codigo;
      if (!conceptoRef) {
        setSerie([]);
        return;
      }
      setSerieLoading(true);
      const data = await bitacoraService.getSeriesByConceptAndPoint(
        conceptoRef,
        selectedPuntoId,
        selectedVariableId,
        20
      );
      const sorted = data.sort(
        (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
      );
      setSerie(sorted);
    } catch (err) {
      console.error('Error fetching bitacora series', err);
      setSerie([]);
    } finally {
      setSerieLoading(false);
    }
  }, [selectedConcept, selectedPuntoId, selectedVariableId]);

  useEffect(() => {
    loadConceptos();
  }, [loadConceptos]);

  useEffect(() => {
    loadSerie();
  }, [loadSerie]);

  const selectedVariable: BitacoraVariable | undefined = useMemo(() => {
    if (!selectedConcept || !selectedVariableId) return undefined;
    return selectedConcept.variables.find(
      (variable) => resolveVariableId(variable) === selectedVariableId
    );
  }, [selectedConcept, selectedVariableId]);

  const selectedPuntoNombre = useMemo(() => {
    if (!selectedConcept || !selectedPuntoId) return undefined;
    return selectedConcept.puntos_medicion.find(
      (punto) => resolvePointId(punto) === selectedPuntoId
    )?.nombre;
  }, [selectedConcept, selectedPuntoId]);

  const conceptButtons = useMemo(
    () =>
      conceptos.map((concepto) => {
        const conceptId = concepto.id ?? concepto.codigo;
        return (
          <Button
            key={conceptId}
            mode={conceptId === activeConceptId ? 'contained-tonal' : 'text'}
            onPress={() => {
              setSelectedConcept(concepto);
              setSelectedPuntoId(resolvePointId(concepto.puntos_medicion[0]));
              setSelectedVariableId(resolveVariableId(concepto.variables[0]));
            }}
            style={styles.selectorChip}
          >
            {concepto.nombre}
          </Button>
        );
      }),
    [conceptos, activeConceptId]
  );

  const puntoButtons = useMemo(() => {
    if (!selectedConcept) return null;
    return selectedConcept.puntos_medicion
      .map((punto) => {
        const puntoId = resolvePointId(punto);
        if (!puntoId) return null;
        return (
          <Button
            key={puntoId}
            mode={puntoId === selectedPuntoId ? 'contained-tonal' : 'text'}
            onPress={() => setSelectedPuntoId(puntoId)}
            style={styles.selectorChip}
          >
            {punto.nombre}
          </Button>
        );
      })
      .filter(Boolean) as React.ReactElement[];
  }, [selectedConcept, selectedPuntoId]);

  const variableButtons = useMemo(() => {
    if (!selectedConcept) return null;
    return selectedConcept.variables
      .map((variable) => {
        const variableId = resolveVariableId(variable);
        if (!variableId) return null;
        return (
          <Button
            key={variableId}
            mode={variableId === selectedVariableId ? 'contained-tonal' : 'text'}
            onPress={() => setSelectedVariableId(variableId)}
            style={styles.selectorChip}
          >
            {variable.nombre}
          </Button>
        );
      })
      .filter(Boolean) as React.ReactElement[];
  }, [selectedConcept, selectedVariableId]);

  const chartData = useMemo(() => {
    if (!serie || serie.length === 0) return null;
    const labels = serie.map((dato) => dayjs(dato.fecha).format('DD/MM'));
    const values = serie.map((dato) => dato.valor);
    const minimoArray =
      selectedVariable?.minimo != null ? serie.map(() => selectedVariable.minimo as number) : null;
    const maximoArray =
      selectedVariable?.maximo != null ? serie.map(() => selectedVariable.maximo as number) : null;
    const deseadoArray =
      selectedVariable?.deseado != null
        ? serie.map(() => selectedVariable.deseado as number)
        : null;

    const datasets: any[] = [
      {
        data: values,
        strokeWidth: 3,
        color: () => '#6200ee',
      },
    ];

    if (minimoArray) {
      datasets.push({
        data: minimoArray,
        strokeWidth: 2,
        color: () => '#ff7043',
        withDots: false,
      });
    }

    if (maximoArray) {
      datasets.push({
        data: maximoArray,
        strokeWidth: 2,
        color: () => '#ff7043',
        withDots: false,
      });
    }

    if (deseadoArray) {
      datasets.push({
        data: deseadoArray,
        strokeWidth: 2,
        color: () => '#4caf50',
        withDots: false,
      });
    }

    return {
      labels,
      datasets,
    };
  }, [serie, selectedVariable]);

  return (
    <View style={styles.wrapper}>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.welcomeCard}>
          <Card.Content>
            <View style={styles.welcomeContent}>
              <MaterialCommunityIcons name="hand-wave" size={40} color="#6200ee" />
              <Text variant="headlineMedium" style={styles.greeting}>
                {getRoleGreeting(user?.rol || '')}
              </Text>
              <Text variant="bodyLarge" style={styles.userName}>
                {user?.nombre_completo}
              </Text>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Resumen del Día
            </Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <MaterialCommunityIcons name="clipboard-list" size={32} color="#6200ee" />
                <Text variant="headlineSmall" style={styles.statNumber}>0</Text>
                <Text variant="bodySmall">Pedidos Hoy</Text>
              </View>
              <View style={styles.statCard}>
                <MaterialCommunityIcons name="package-variant" size={32} color="#6200ee" />
                <Text variant="headlineSmall" style={styles.statNumber}>0</Text>
                <Text variant="bodySmall">Productos</Text>
              </View>
              <View style={styles.statCard}>
                <MaterialCommunityIcons name="alert-circle" size={32} color="#ff9800" />
                <Text variant="headlineSmall" style={styles.statNumber}>0</Text>
                <Text variant="bodySmall">Alertas</Text>
              </View>
              <View style={styles.statCard}>
                <MaterialCommunityIcons name="check-circle" size={32} color="#4caf50" />
                <Text variant="headlineSmall" style={styles.statNumber}>0</Text>
                <Text variant="bodySmall">Completados</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Accesos Rápidos
            </Text>
            <View style={styles.quickActions}>
              <Button
                mode="contained"
                icon="plus"
                style={styles.actionButton}
                onPress={() => console.log('Nuevo pedido')}
              >
                Nuevo Pedido
              </Button>
              <Button
                mode="outlined"
                icon="magnify"
                style={styles.actionButton}
                onPress={() => console.log('Buscar')}
              >
                Buscar
              </Button>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Actividad Reciente
            </Text>
            <Text variant="bodyMedium" style={styles.emptyState}>
              No hay actividad reciente
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Seguimiento de Bitacoras
            </Text>
            {conceptos.length === 0 ? (
              <Text style={styles.emptyState}>
                Aún no se han configurado conceptos de bitacoras.
              </Text>
            ) : (
              <>
                {conceptButtons.length > 0 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.selectorRow}>{conceptButtons}</View>
                  </ScrollView>
                )}
                {selectedConcept ? (
                  <>
                    {puntoButtons && puntoButtons.length > 0 && (
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={styles.selectorRow}>{puntoButtons}</View>
                      </ScrollView>
                    )}
                    {variableButtons && variableButtons.length > 0 && (
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={styles.selectorRow}>{variableButtons}</View>
                      </ScrollView>
                    )}
                  </>
                ) : null}

                {serieLoading ? (
                  <ActivityIndicator animating style={styles.chartLoading} />
                ) : chartData ? (
                  <View style={styles.chartContainer}>
                    <LineChart
                      data={chartData}
                      width={chartWidth}
                      height={220}
                      yAxisSuffix={selectedVariable?.unidad ? ` ${selectedVariable.unidad}` : ''}
                      chartConfig={{
                        backgroundGradientFrom: '#ffffff',
                        backgroundGradientTo: '#ffffff',
                        decimalPlaces: 2,
                        color: (opacity = 1) => `rgba(98, 0, 238, ${opacity})`,
                        labelColor: (opacity = 1) => `rgba(102, 102, 102, ${opacity})`,
                        propsForDots: {
                          r: '4',
                          strokeWidth: '2',
                          stroke: '#6200ee',
                        },
                      }}
                      bezier
                      style={styles.chart}
                    />
                    <View style={styles.thresholdLegend}>
                      <View style={styles.legendItem}>
                        <View style={[styles.legendSwatch, { backgroundColor: '#6200ee' }]} />
                        <Text variant="bodySmall">Lecturas</Text>
                      </View>
                      {selectedVariable?.minimo != null && (
                        <View style={styles.legendItem}>
                          <View style={[styles.legendSwatch, { backgroundColor: '#ff7043' }]} />
                          <Text variant="bodySmall">Minimo</Text>
                        </View>
                      )}
                      {selectedVariable?.maximo != null && (
                        <View style={styles.legendItem}>
                          <View style={[styles.legendSwatch, { backgroundColor: '#ff7043' }]} />
                          <Text variant="bodySmall">Maximo</Text>
                        </View>
                      )}
                      {selectedVariable?.deseado != null && (
                        <View style={styles.legendItem}>
                          <View style={[styles.legendSwatch, { backgroundColor: '#4caf50' }]} />
                          <Text variant="bodySmall">Deseado</Text>
                        </View>
                      )}
                    </View>
                    <Text variant="bodySmall" style={styles.chartCaption}>
                      {selectedConcept?.nombre}
                      {selectedPuntoNombre ? ` · ${selectedPuntoNombre}` : ''}
                      {selectedVariable ? ` · ${selectedVariable.nombre}` : ''}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.emptyState}>
                    No hay lecturas suficientes para graficar este concepto.
                  </Text>
                )}
              </>
            )}
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  welcomeCard: {
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: '#e8def8',
  },
  welcomeContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  greeting: {
    fontWeight: 'bold',
    marginTop: 12,
    color: '#6200ee',
  },
  userName: {
    marginTop: 4,
    color: '#666',
  },
  card: {
    marginBottom: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  statNumber: {
    fontWeight: 'bold',
    marginVertical: 8,
  },
  quickActions: {
    flexDirection: 'column',
  },
  actionButton: {
    marginBottom: 12,
  },
  emptyState: {
    textAlign: 'center',
    color: '#999',
    paddingVertical: 20,
  },
  helper: {
    textAlign: 'center',
    color: '#777',
    marginVertical: 8,
  },
  selectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectorChip: {
    marginRight: 8,
    marginTop: 8,
  },
  chartContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  chart: {
    borderRadius: 12,
  },
  chartLoading: {
    marginVertical: 24,
  },
  thresholdLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  legendSwatch: {
    width: 12,
    height: 12,
    borderRadius: 2,
    marginRight: 6,
  },
  chartCaption: {
    textAlign: 'center',
    marginTop: 8,
    color: '#666',
  },
});

export default HomeScreen;
