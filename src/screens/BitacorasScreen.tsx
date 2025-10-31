import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, FlatList } from 'react-native';
import {
  ActivityIndicator,
  Button,
  Card,
  Chip,
  Divider,
  HelperText,
  IconButton,
  List,
  Modal,
  Portal,
  Searchbar,
  SegmentedButtons,
  Text,
  TextInput,
} from 'react-native-paper';
import dayjs from 'dayjs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { bitacoraService } from '../services/bitacora.service';
import {
  BitacoraConcepto,
  BitacoraMedicionDetallePunto,
  BitacoraMedicionEntrada,
  BitacoraGeneralEntrada,
  BitacoraVariable,
  BitacoraPuntoMedicion,
} from '../types/bitacora.types';
import CalendarPickerModal from '../components/common/CalendarPickerModal';
import { hasPermission } from '../constants/roles';

type BitacoraMode = 'medicion' | 'general';

interface VariableInputState {
  valor: string;
  comentario: string;
}

type ValoresPorPunto = Record<string, Record<string, VariableInputState>>;

const normalizeKey = (value?: string | null, prefix: string = 'item') =>
  value ? value.toString() : `${prefix}-${'sin-id'}`;

const resolvePuntoId = (punto: BitacoraPuntoMedicion): string => {
  return (
    punto.id ||
    punto.slug ||
    (punto.nombre ? punto.nombre.toLowerCase().replace(/\s+/g, '-') : undefined) ||
    normalizeKey(undefined, 'punto')
  );
};

const resolveVariableId = (variable: BitacoraVariable): string => {
  return (
    variable.id ||
    variable.slug ||
    (variable.nombre ? variable.nombre.toLowerCase().replace(/\s+/g, '-') : undefined) ||
    normalizeKey(undefined, 'variable')
  );
};

const buildInitialValores = (concepto: BitacoraConcepto | null): ValoresPorPunto => {
  if (!concepto) return {};
  const result: ValoresPorPunto = {};

  concepto.puntos_medicion.forEach((punto) => {
    const puntoId = resolvePuntoId(punto);
    result[puntoId] = {};
    concepto.variables.forEach((variable) => {
      const variableId = resolveVariableId(variable);
      result[puntoId][variableId] = { valor: '', comentario: '' };
    });
  });

  return result;
};

const BitacorasScreen = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [mode, setMode] = useState<BitacoraMode>('medicion');
  const [conceptos, setConceptos] = useState<BitacoraConcepto[]>([]);
  const [conceptoSeleccionado, setConceptoSeleccionado] = useState<BitacoraConcepto | null>(null);
  const [showConceptModal, setShowConceptModal] = useState(false);
  const [conceptQuery, setConceptQuery] = useState('');
  const [valores, setValores] = useState<ValoresPorPunto>({});
  const [observaciones, setObservaciones] = useState('');
  const [fechaMedicion, setFechaMedicion] = useState(dayjs().format('YYYY-MM-DD'));
  const [showMedicionCalendar, setShowMedicionCalendar] = useState(false);
  const [medicionesRecientes, setMedicionesRecientes] = useState<BitacoraMedicionEntrada[]>([]);
  const [medicionesLoading, setMedicionesLoading] = useState(false);
  const [savingMedicion, setSavingMedicion] = useState(false);
  const [conceptLoading, setConceptLoading] = useState(false);

  const [generalFecha, setGeneralFecha] = useState(dayjs().format('YYYY-MM-DD'));
  const [showGeneralCalendar, setShowGeneralCalendar] = useState(false);
  const [generalForm, setGeneralForm] = useState({
    titulo: '',
    resumen: '',
    actividades: '',
    incidencias: '',
    pendientes: '',
    recomendaciones: '',
    turno: '',
    area: '',
  });
  const [generalRecientes, setGeneralRecientes] = useState<BitacoraGeneralEntrada[]>([]);
  const [generalLoading, setGeneralLoading] = useState(false);
  const [generalSaving, setGeneralSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canCreateBitacora = Boolean(user?.rol && hasPermission(user.rol, 'CREATE_BITACORA'));

  const loadConceptos = useCallback(async () => {
    try {
      setConceptLoading(true);
      const data = await bitacoraService.getConceptos();
      setConceptos(data);
      if (!conceptoSeleccionado && data.length > 0) {
        setConceptoSeleccionado(data[0]);
        setValores(buildInitialValores(data[0]));
      }
    } catch (err: any) {
      console.error('Error loading conceptos', err);
      setError(err.message ?? 'No se pudieron cargar las bitacoras');
    } finally {
      setConceptLoading(false);
    }
  }, [conceptoSeleccionado]);

  const loadMediciones = useCallback(
    async (conceptoId?: string) => {
      try {
        setMedicionesLoading(true);
        const data = await bitacoraService.getMediciones(conceptoId, 25);
        setMedicionesRecientes(data);
      } catch (err: any) {
        console.error('Error loading mediciones', err);
        setError(err.message ?? 'No se pudieron cargar las mediciones');
      } finally {
        setMedicionesLoading(false);
      }
    },
    []
  );

  const loadGeneral = useCallback(async () => {
    try {
      setGeneralLoading(true);
      const data = await bitacoraService.getBitacoraGeneral(25);
      setGeneralRecientes(data);
    } catch (err: any) {
      console.error('Error loading bitacora general', err);
      setError(err.message ?? 'No se pudo cargar la bitacora general');
    } finally {
      setGeneralLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConceptos();
    loadMediciones();
    loadGeneral();
  }, [loadConceptos, loadMediciones, loadGeneral]);

  useEffect(() => {
    if (conceptoSeleccionado) {
      setValores(buildInitialValores(conceptoSeleccionado));
      loadMediciones(conceptoSeleccionado.id ?? conceptoSeleccionado.codigo);
    }
  }, [conceptoSeleccionado, loadMediciones]);

  const handleValorChange = (
    puntoId: string,
    variable: BitacoraVariable,
    field: keyof VariableInputState,
    value: string
  ) => {
    const variableId = resolveVariableId(variable);
    setValores((prev) => ({
      ...prev,
      [puntoId]: {
        ...(prev[puntoId] ?? {}),
        [variableId]: {
          ...(prev[puntoId]?.[variableId] ?? { valor: '', comentario: '' }),
          [field]: value,
        },
      },
    }));
  };

  const validateMedicion = (): string | null => {
    if (!conceptoSeleccionado) {
      return 'Selecciona un concepto de bitacora';
    }
    if (!fechaMedicion) {
      return 'Selecciona la fecha de la medicion';
    }

    for (const punto of conceptoSeleccionado.puntos_medicion) {
      const puntoId = resolvePuntoId(punto);
      const valorPunto = valores[puntoId];
      if (!valorPunto) {
        return `Captura los valores para el punto de medicion ${punto.nombre}`;
      }

      for (const variable of conceptoSeleccionado.variables) {
        const variableId = resolveVariableId(variable);
        const entrada = valorPunto[variableId];
        if (!entrada || entrada.valor.trim() === '') {
          return `La variable ${variable.nombre} en ${punto.nombre} es obligatoria`;
        }

        if (variable.tipo === 'numero') {
          const numeric = Number(entrada.valor);
          if (Number.isNaN(numeric)) {
            return `La variable ${variable.nombre} en ${punto.nombre} debe ser numerica`;
          }
        }
      }
    }

    return null;
  };

  const handleGuardarMedicion = async () => {
    if (!user) {
      setError('Es necesario iniciar sesion para registrar bitacoras');
      return;
    }

    const validationError = validateMedicion();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!conceptoSeleccionado) return;

    try {
      setSavingMedicion(true);
      setError(null);

      const mediciones: BitacoraMedicionDetallePunto[] = conceptoSeleccionado.puntos_medicion.map(
        (punto) => ({
          punto_id: punto.id || punto.slug || punto.nombre,
          punto_nombre: punto.nombre,
          variables: conceptoSeleccionado.variables.map((variable) => {
            const puntoId = resolvePuntoId(punto);
            const variableId = resolveVariableId(variable);
            const entrada = valores[puntoId]?.[variableId] ?? { valor: '', comentario: '' };
            const valorNumerico =
              variable.tipo === 'numero' ? Number(entrada.valor) : entrada.valor || null;

            return {
              variable_id: variable.id || variable.slug || variable.nombre,
              variable_nombre: variable.nombre,
              unidad: variable.unidad ?? null,
              valor: valorNumerico,
              comentario: entrada.comentario?.trim() || null,
            };
          }),
        })
      );

      const inserted = await bitacoraService.createMedicion(
        {
          concepto_id: conceptoSeleccionado.id,
          concepto_codigo: conceptoSeleccionado.codigo,
          concepto_nombre: conceptoSeleccionado.nombre,
          fecha_medicion: fechaMedicion,
          mediciones,
          observaciones: observaciones?.trim() || undefined,
        },
        {
          id: user.id,
          nombre: user.nombre_completo,
          rol: user.rol,
        }
      );

      await bitacoraService.evaluateThresholds(conceptoSeleccionado, mediciones, inserted);

      setMedicionesRecientes((prev) => [inserted, ...prev].slice(0, 25));
      setValores(buildInitialValores(conceptoSeleccionado));
      setObservaciones('');
      setFechaMedicion(dayjs().format('YYYY-MM-DD'));
    } catch (err: any) {
      console.error('Error guardando bitacora', err);
      setError(err.message ?? 'No se pudo guardar la bitacora');
    } finally {
      setSavingMedicion(false);
    }
  };

  const handleGuardarGeneral = async () => {
    if (!user) {
      setError('Es necesario iniciar sesion para registrar la bitacora general');
      return;
    }

    if (!generalForm.titulo.trim()) {
      setError('El titulo es obligatorio');
      return;
    }
    if (!generalForm.resumen.trim()) {
      setError('Describe brevemente las actividades del dia');
      return;
    }

    try {
      setGeneralSaving(true);
      setError(null);

      const inserted = await bitacoraService.createBitacoraGeneral(
        {
          fecha: generalFecha,
          titulo: generalForm.titulo.trim(),
          resumen: generalForm.resumen.trim(),
          actividades: generalForm.actividades?.trim() || undefined,
          incidencias: generalForm.incidencias?.trim() || undefined,
          pendientes: generalForm.pendientes?.trim() || undefined,
          recomendaciones: generalForm.recomendaciones?.trim() || undefined,
          turno: generalForm.turno?.trim() || undefined,
          area: generalForm.area?.trim() || undefined,
        },
        {
          id: user.id,
          nombre: user.nombre_completo,
          rol: user.rol,
        }
      );

      setGeneralRecientes((prev) => [inserted, ...prev].slice(0, 25));
      setGeneralForm({
        titulo: '',
        resumen: '',
        actividades: '',
        incidencias: '',
        pendientes: '',
        recomendaciones: '',
        turno: '',
        area: '',
      });
      setGeneralFecha(dayjs().format('YYYY-MM-DD'));
    } catch (err: any) {
      console.error('Error guardando bitacora general', err);
      setError(err.message ?? 'No se pudo guardar la bitacora general');
    } finally {
      setGeneralSaving(false);
    }
  };

  const filteredConceptos = useMemo(() => {
    if (!conceptQuery.trim()) return conceptos;
    const query = conceptQuery.toLowerCase();
    return conceptos.filter(
      (concepto) =>
        concepto.nombre.toLowerCase().includes(query) ||
        concepto.codigo.toLowerCase().includes(query)
    );
  }, [conceptos, conceptQuery]);

  const renderVariableHint = (variable: BitacoraVariable) => {
    const parts: string[] = [];
    if (variable.deseado != null) parts.push(`Deseado ${variable.deseado}`);
    if (variable.minimo != null) parts.push(`Min ${variable.minimo}`);
    if (variable.maximo != null) parts.push(`Max ${variable.maximo}`);

    if (parts.length === 0) return null;
    return parts.join('  •  ');
  };

  const renderMediciones = () => (
    <View>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Registro de mediciones
          </Text>

          <SegmentedButtons
            value={mode}
            onValueChange={(value) => setMode(value as BitacoraMode)}
            style={styles.segmentedControl}
            buttons={[
              { value: 'medicion', label: 'Mediciones' },
              { value: 'general', label: 'Diario' },
            ]}
          />

          <View style={styles.inputGroup}>
            <Text variant="labelLarge" style={styles.label}>
              Concepto *
            </Text>
            <Button
              mode="outlined"
              icon="clipboard-list"
              onPress={() => setShowConceptModal(true)}
              style={styles.selectorButton}
            >
              {conceptoSeleccionado ? conceptoSeleccionado.nombre : 'Seleccionar concepto'}
            </Button>
            {conceptoSeleccionado ? (
              <Text variant="bodySmall" style={styles.helper}>
                Variables: {conceptoSeleccionado.variables.length} · Puntos de medicion:{' '}
                {conceptoSeleccionado.puntos_medicion.length}
              </Text>
            ) : null}
          </View>

          <View style={styles.inputGroup}>
            <Text variant="labelLarge" style={styles.label}>
              Fecha de medicion *
            </Text>
            <Button
              mode="outlined"
              icon="calendar"
              onPress={() => setShowMedicionCalendar(true)}
              style={styles.selectorButton}
            >
              {fechaMedicion ? dayjs(fechaMedicion).format('DD/MM/YYYY') : 'Seleccionar fecha'}
            </Button>
          </View>

          <TextInput
            label="Observaciones (opcional)"
            value={observaciones}
            onChangeText={setObservaciones}
            multiline
            mode="outlined"
            style={styles.textInput}
          />
        </Card.Content>
      </Card>

      {conceptoSeleccionado &&
        conceptoSeleccionado.puntos_medicion.map((punto) => {
          const puntoId = resolvePuntoId(punto);
          return (
            <Card key={puntoId} style={styles.card}>
              <Card.Content>
                <View style={styles.puntoHeader}>
                  <View>
                    <Text variant="titleMedium" style={styles.puntoTitle}>
                      {punto.nombre}
                  </Text>
                  {punto.ubicacion ? (
                    <Text variant="bodySmall" style={styles.puntoSubtitle}>
                      {punto.ubicacion}
                    </Text>
                  ) : null}
                </View>
                <Chip icon="map-marker" compact>
                  Punto de medicion
                </Chip>
              </View>

              {conceptoSeleccionado.variables.map((variable) => {
                const variableId = resolveVariableId(variable);
                const currentValue = valores[puntoId]?.[variableId] ?? {
                  valor: '',
                  comentario: '',
                };

                return (
                  <View key={`${puntoId}-${variableId}`} style={styles.variableContainer}>
                    <Text variant="labelLarge" style={styles.variableLabel}>
                      {variable.nombre}{' '}
                      {variable.unidad ? <Text variant="bodySmall">({variable.unidad})</Text> : null}
                    </Text>
                    {renderVariableHint(variable) ? (
                      <Text variant="bodySmall" style={styles.variableHint}>
                        {renderVariableHint(variable)}
                      </Text>
                    ) : null}

                    <TextInput
                      label="Valor registrado"
                      value={currentValue.valor}
                      onChangeText={(value) =>
                        handleValorChange(puntoId, variable, 'valor', value)
                      }
                      keyboardType={variable.tipo === 'numero' ? 'numeric' : 'default'}
                      mode="outlined"
                      style={styles.textInput}
                    />

                    <TextInput
                      label="Comentario (opcional)"
                      value={currentValue.comentario}
                      onChangeText={(value) =>
                        handleValorChange(puntoId, variable, 'comentario', value)
                      }
                      mode="outlined"
                      style={styles.textInput}
                      multiline
                    />
                  </View>
                );
              })}
            </Card.Content>
          </Card>
          );
        })}

      {error && mode === 'medicion' ? <HelperText type="error">{error}</HelperText> : null}

      <Button
        mode="contained"
        icon="content-save"
        style={styles.saveButton}
        onPress={handleGuardarMedicion}
        loading={savingMedicion}
        disabled={!conceptoSeleccionado || savingMedicion || !canCreateBitacora}
      >
        Guardar medicion
      </Button>

      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.historyHeader}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Historial reciente
            </Text>
            <IconButton icon="refresh" onPress={() => loadMediciones(conceptoSeleccionado?.id)} />
          </View>

          {medicionesLoading ? (
            <ActivityIndicator animating />
          ) : medicionesRecientes.length === 0 ? (
            <Text style={styles.emptyState}>No hay registros recientes</Text>
          ) : (
            <FlatList
              data={medicionesRecientes}
              keyExtractor={(item) => item.id}
              ItemSeparatorComponent={() => <Divider style={styles.divider} />}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <List.Item
                  title={`${item.concepto_nombre} · ${dayjs(item.fecha_medicion).format(
                    'DD/MM/YYYY'
                  )}`}
                  description={`Registrado por ${item.registrado_por_nombre}`}
                  right={() => <Chip compact>{item.mediciones.length} puntos</Chip>}
                />
              )}
            />
          )}
        </Card.Content>
      </Card>
    </View>
  );

  const renderBitacoraGeneral = () => (
    <View>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Bitacora general del dia
          </Text>

          <SegmentedButtons
            value={mode}
            onValueChange={(value) => setMode(value as BitacoraMode)}
            style={styles.segmentedControl}
            buttons={[
              { value: 'medicion', label: 'Mediciones' },
              { value: 'general', label: 'Diario' },
            ]}
          />

          <View style={styles.inputGroup}>
            <Text variant="labelLarge" style={styles.label}>
              Fecha
            </Text>
            <Button
              mode="outlined"
              icon="calendar"
              onPress={() => setShowGeneralCalendar(true)}
              style={styles.selectorButton}
            >
              {dayjs(generalFecha).format('DD/MM/YYYY')}
            </Button>
          </View>

          <TextInput
            label="Titulo del dia"
            value={generalForm.titulo}
            onChangeText={(value) => setGeneralForm((prev) => ({ ...prev, titulo: value }))}
            mode="outlined"
            style={styles.textInput}
          />

          <TextInput
            label="Resumen"
            value={generalForm.resumen}
            onChangeText={(value) => setGeneralForm((prev) => ({ ...prev, resumen: value }))}
            mode="outlined"
            multiline
            style={styles.textInput}
          />

          <TextInput
            label="Actividades destacadas"
            value={generalForm.actividades}
            onChangeText={(value) => setGeneralForm((prev) => ({ ...prev, actividades: value }))}
            mode="outlined"
            multiline
            style={styles.textInput}
          />

          <TextInput
            label="Incidencias / Alertas"
            value={generalForm.incidencias}
            onChangeText={(value) => setGeneralForm((prev) => ({ ...prev, incidencias: value }))}
            mode="outlined"
            multiline
            style={styles.textInput}
          />

          <TextInput
            label="Pendientes"
            value={generalForm.pendientes}
            onChangeText={(value) => setGeneralForm((prev) => ({ ...prev, pendientes: value }))}
            mode="outlined"
            multiline
            style={styles.textInput}
          />

          <TextInput
            label="Recomendaciones / mensaje al equipo"
            value={generalForm.recomendaciones}
            onChangeText={(value) => setGeneralForm((prev) => ({ ...prev, recomendaciones: value }))}
            mode="outlined"
            multiline
            style={styles.textInput}
          />

          <TextInput
            label="Turno"
            value={generalForm.turno}
            onChangeText={(value) => setGeneralForm((prev) => ({ ...prev, turno: value }))}
            mode="outlined"
            style={styles.textInput}
          />

          <TextInput
            label="Area"
            value={generalForm.area}
            onChangeText={(value) => setGeneralForm((prev) => ({ ...prev, area: value }))}
            mode="outlined"
            style={styles.textInput}
          />
        </Card.Content>
      </Card>

      {error && mode === 'general' ? <HelperText type="error">{error}</HelperText> : null}

      <Button
        mode="contained"
        icon="content-save"
        style={styles.saveButton}
        onPress={handleGuardarGeneral}
        loading={generalSaving}
        disabled={generalSaving || !canCreateBitacora}
      >
        Guardar entrada
      </Button>

      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.historyHeader}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Diario reciente
            </Text>
            <IconButton icon="refresh" onPress={loadGeneral} />
          </View>

          {generalLoading ? (
            <ActivityIndicator animating />
          ) : generalRecientes.length === 0 ? (
            <Text style={styles.emptyState}>Aun no hay notas registradas</Text>
          ) : (
            <FlatList
              data={generalRecientes}
              keyExtractor={(item) => item.id}
              ItemSeparatorComponent={() => <Divider style={styles.divider} />}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <List.Item
                  title={`${dayjs(item.fecha).format('DD/MM/YYYY')} · ${item.titulo}`}
                  description={`Por ${item.ejecutor_nombre}`}
                  right={() => (
                    <MaterialCommunityIcons name="notebook-edit" size={20} color="#6200ee" />
                  )}
                />
              )}
            />
          )}
        </Card.Content>
      </Card>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <MaterialCommunityIcons name="notebook" size={42} color="#6200ee" />
          <Text variant="headlineSmall" style={styles.headerTitle}>
            Bitacoras
          </Text>
          <Text variant="bodyMedium" style={styles.headerSubtitle}>
            Registra lecturas y comunica avances diarios del equipo de mantenimiento
          </Text>
        </View>

        {mode === 'medicion' ? renderMediciones() : renderBitacoraGeneral()}
      </ScrollView>

      <Portal>
        <CalendarPickerModal
          visible={showMedicionCalendar}
          initialDate={fechaMedicion}
          onDismiss={() => setShowMedicionCalendar(false)}
          onConfirm={(value) => setFechaMedicion(value)}
        />
        <CalendarPickerModal
          visible={showGeneralCalendar}
          initialDate={generalFecha}
          onDismiss={() => setShowGeneralCalendar(false)}
          onConfirm={(value) => setGeneralFecha(value)}
        />

        <Modal
          visible={showConceptModal}
          onDismiss={() => setShowConceptModal(false)}
          contentContainerStyle={styles.selectorModal}
        >
          <Text variant="titleMedium" style={styles.selectorTitle}>
            Seleccionar concepto
          </Text>
          <Searchbar
            placeholder="Buscar por nombre o codigo"
            value={conceptQuery}
            onChangeText={setConceptQuery}
            style={styles.selectorSearch}
          />
          {conceptLoading ? (
            <ActivityIndicator animating />
          ) : (
            <FlatList
              data={filteredConceptos}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              ItemSeparatorComponent={() => <Divider />}
              renderItem={({ item }) => (
                <List.Item
                  title={item.nombre}
                  description={`Variables: ${item.variables.length}  •  Puntos: ${item.puntos_medicion.length}`}
                  onPress={() => {
                    setConceptoSeleccionado(item);
                    setShowConceptModal(false);
                  }}
                  right={() => <Chip compact>{item.codigo}</Chip>}
                />
              )}
              ListEmptyComponent={
                <Text style={styles.emptyState}>No se encontraron conceptos activos</Text>
              }
              style={styles.selectorList}
            />
          )}
          <Button onPress={() => setShowConceptModal(false)}>Cerrar</Button>
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scroll: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 48,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    textAlign: 'center',
    color: '#666',
    marginTop: 4,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 12,
  },
  card: {
    marginBottom: 16,
    borderRadius: 12,
  },
  segmentedControl: {
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 6,
  },
  selectorButton: {
    alignSelf: 'flex-start',
  },
  helper: {
    marginTop: 4,
    color: '#777',
  },
  textInput: {
    marginBottom: 12,
  },
  puntoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  puntoTitle: {
    fontWeight: '600',
  },
  puntoSubtitle: {
    color: '#666',
  },
  variableContainer: {
    marginBottom: 16,
  },
  variableLabel: {
    fontWeight: '600',
  },
  variableHint: {
    color: '#777',
    marginBottom: 8,
  },
  saveButton: {
    marginBottom: 16,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emptyState: {
    textAlign: 'center',
    color: '#777',
    paddingVertical: 16,
  },
  divider: {
    marginVertical: 8,
  },
  selectorModal: {
    margin: 24,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  selectorTitle: {
    fontWeight: '600',
    marginBottom: 12,
  },
  selectorSearch: {
    marginBottom: 12,
  },
  selectorList: {
    maxHeight: 280,
    marginBottom: 16,
  },
});

export default BitacorasScreen;
