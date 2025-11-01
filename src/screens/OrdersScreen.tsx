import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert, ScrollView, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import {
  Card,
  Text,
  Chip,
  FAB,
  Button,
  SegmentedButtons,
  Portal,
  Modal,
  TextInput,
  HelperText,
  List,
  Divider,
  IconButton,
  ActivityIndicator,
  Dialog,
  Searchbar,
  Checkbox,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import {
  ORDER_PRIORITY_LABELS,
  ORDER_STATUS_LABELS,
  ORDER_TYPE_LABELS,
  OrderPriority,
  OrderStatus,
  OrderType,
  OrdenMtto,
} from '../types/order.types';
import { ordersService } from '../services/orders.service';
import { notificationService } from '../services/notification.service';
import { userService } from '../services/user.service';
import { Usuario } from '../types/user.types';
import { hasPermission } from '../constants/roles';
import CalendarPickerModal from '../components/common/CalendarPickerModal';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { storageService } from '../services/storage.service';
import { supabase } from '../services/supabase';

type StatusFilter = OrderStatus | 'todos';
type TypeFilter = OrderType | 'todos';

interface OrderFormState {
  titulo: string;
  descripcion: string;
  tipo: OrderType;
  prioridad: OrderPriority;
  fechaProgramada: string;
  supervisorId?: string;
  colaboradorAreaId?: string;
  metadata: Record<string, string>;
}

const ORDER_TYPE_ICONS: Record<OrderType, keyof typeof MaterialCommunityIcons.glyphMap> = {
  correctiva: 'wrench',
  preventiva: 'shield-check',
  mejora: 'lightbulb-on-outline',
  predictiva: 'chart-line',
  autonomo: 'account-hard-hat',
};

const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pendiente: '#ef6c00',
  en_proceso: '#1976d2',
  completado: '#4caf50', // Verde más brillante para órdenes completadas
};

const DEFAULT_METADATA: Record<OrderType, Record<string, string>> = {
  correctiva: {
    equipo: '',
    ubicacion: '',
    sintoma: '',
    causa_probable: '',
  },
  preventiva: {
    plan_mantenimiento: '',
    frecuencia: '',
    lista_actividades: '',
  },
  mejora: {
    oportunidad: '',
    beneficio_esperado: '',
    recurso_estimado: '',
    tiempo_estimado: '',
  },
  predictiva: {
    indicador: '',
    valor_umbral: '',
    accion_recomendada: '',
  },
  autonomo: {
    equipo: '',
    descripcion_tarea: '',
    recursos_necesarios: '',
  },
};

const ORDER_METADATA_FIELDS: Record<
  OrderType,
  Array<{ key: string; label: string; required?: boolean; multiline?: boolean }>
> = {
  correctiva: [
    { key: 'equipo', label: 'Equipo o activo', required: true },
    { key: 'ubicacion', label: 'Ubicacion', required: true },
    { key: 'sintoma', label: 'Sintoma reportado', required: true, multiline: true },
    { key: 'causa_probable', label: 'Causa probable', multiline: true },
  ],
  preventiva: [
    { key: 'plan_mantenimiento', label: 'Plan de mantenimiento', required: true },
    { key: 'frecuencia', label: 'Frecuencia', required: true },
    { key: 'lista_actividades', label: 'Actividades a ejecutar', required: true, multiline: true },
  ],
  mejora: [
    { key: 'oportunidad', label: 'Oportunidad de mejora', required: true, multiline: true },
    { key: 'beneficio_esperado', label: 'Beneficio esperado', required: true, multiline: true },
    { key: 'recurso_estimado', label: 'Recursos estimados', multiline: true },
    { key: 'tiempo_estimado', label: 'Tiempo estimado', multiline: true },
  ],
  predictiva: [
    { key: 'indicador', label: 'Indicador monitoreado', required: true },
    { key: 'valor_umbral', label: 'Valor umbral', required: true },
    { key: 'accion_recomendada', label: 'Accion recomendada', required: true, multiline: true },
  ],
  autonomo: [
    { key: 'equipo', label: 'Equipo o area', required: true },
    { key: 'descripcion_tarea', label: 'Descripcion de la tarea', required: true, multiline: true },
    { key: 'recursos_necesarios', label: 'Recursos necesarios', multiline: true },
  ],
};

const requiresSupervisor = (type: OrderType) =>
  type === 'predictiva' || type === 'mejora' || type === 'autonomo';

const requiresCollaborator = (type: OrderType) => type === 'preventiva';

const getApprovalOwnerId = (order: OrdenMtto): string | null => {
  if (order.tipo === 'preventiva') {
    return order.colaborador_area_id ?? order.solicitante_id ?? null;
  }
  if (order.tipo === 'correctiva') {
    return order.solicitante_id ?? null;
  }
  if (requiresSupervisor(order.tipo)) {
    return order.supervisor_id ?? null;
  }
  return order.solicitante_id ?? null;
};

const formatDate = (value?: string | null) => {
  if (!value) return 'No definido';
  return dayjs(value).format('DD/MM/YYYY');
};

const RatingSelector = ({
  value,
  onChange,
}: {
  value: number;
  onChange: (score: number) => void;
}) => (
  <View style={styles.ratingRow}>
    {[1, 2, 3, 4, 5].map((score) => (
      <IconButton
        key={score}
        icon={({ size, color }) => (
          <MaterialCommunityIcons
            name={score <= value ? 'star' : 'star-outline'}
            size={size}
            color={color ?? '#f5b301'}
          />
        )}
        size={28}
        iconColor="#f5b301"
        onPress={() => onChange(score)}
        accessibilityLabel={`Calificacion ${score}`}
      />
    ))}
  </View>
);

interface OrderFormModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSubmit: (form: OrderFormState) => void;
  loading: boolean;
  supervisors: Usuario[];
  collaborators: Usuario[];
}

const OrderFormModal: React.FC<OrderFormModalProps> = ({
  visible,
  onDismiss,
  onSubmit,
  loading,
  supervisors,
  collaborators,
}) => {
  console.log('[OrderFormModal] Rendering with visible:', visible);

  const [form, setForm] = useState<OrderFormState>({
    titulo: '',
    descripcion: '',
    tipo: 'correctiva',
    prioridad: 'media',
    fechaProgramada: '',
    supervisorId: undefined,
    colaboradorAreaId: undefined,
    metadata: { ...DEFAULT_METADATA.correctiva },
  });
  const [error, setError] = useState<string | null>(null);
  const [showSupervisorSelector, setShowSupervisorSelector] = useState(false);
  const [showCollaboratorSelector, setShowCollaboratorSelector] = useState(false);
  const [supervisorQuery, setSupervisorQuery] = useState('');
  const [collaboratorQuery, setCollaboratorQuery] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    console.log('[OrderFormModal] visible changed to:', visible);
    if (!visible) {
      setForm({
        titulo: '',
        descripcion: '',
        tipo: 'correctiva',
        prioridad: 'media',
        fechaProgramada: '',
        supervisorId: undefined,
        colaboradorAreaId: undefined,
        metadata: { ...DEFAULT_METADATA.correctiva },
      });
      setError(null);
      setSupervisorQuery('');
      setCollaboratorQuery('');
      setShowDatePicker(false);
    }
  }, [visible]);

  const handleChangeType = (type: OrderType) => {
    setForm((prev) => ({
      ...prev,
      tipo: type,
      metadata: { ...DEFAULT_METADATA[type] },
      supervisorId: requiresSupervisor(type) ? prev.supervisorId : undefined,
      colaboradorAreaId: requiresCollaborator(type) ? prev.colaboradorAreaId : undefined,
    }));
  };

  const handleMetadataChange = (key: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        [key]: value,
      },
    }));
  };

  const handleDateSelected = (value: string) => {
    setForm((prev) => ({
      ...prev,
      fechaProgramada: value,
    }));
  };

  const handleClearDate = () => {
    setForm((prev) => ({
      ...prev,
      fechaProgramada: '',
    }));
  };

  const validate = (): string | null => {
    if (!form.titulo.trim()) {
      return 'El titulo es obligatorio';
    }
    if (!form.descripcion.trim()) {
      return 'La descripcion es obligatoria';
    }
    if (form.fechaProgramada && !/^\d{4}-\d{2}-\d{2}$/.test(form.fechaProgramada.trim())) {
      return 'Selecciona una fecha valida';
    }
    const metadataFields = ORDER_METADATA_FIELDS[form.tipo];
    for (const field of metadataFields) {
      const value = (form.metadata[field.key] ?? '').trim();
      if (field.required && !value) {
        return `El campo "${field.label}" es obligatorio`;
      }
    }
    if (requiresSupervisor(form.tipo) && !form.supervisorId) {
      return 'Debe seleccionar un supervisor responsable';
    }
    if (requiresCollaborator(form.tipo) && !form.colaboradorAreaId) {
      return 'Debe seleccionar un colaborador del area';
    }
    return null;
  };

  const handleSubmit = () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    onSubmit(form);
  };

  const selectedSupervisor = supervisors.find((item) => item.id === form.supervisorId) ?? null;
  const selectedCollaborator =
    collaborators.find((item) => item.id === form.colaboradorAreaId) ?? null;

  const filteredSupervisors = supervisors.filter((item) =>
    item.nombre_completo.toLowerCase().includes(supervisorQuery.toLowerCase())
  );

  const filteredCollaborators = collaborators.filter((item) =>
    item.nombre_completo.toLowerCase().includes(collaboratorQuery.toLowerCase())
  );

  console.log('[OrderFormModal] About to render Portal and Modal, visible:', visible);

  if (!visible) {
    console.log('[OrderFormModal] Not rendering because visible is false');
    return null;
  }

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modalContent}
        dismissable={true}
      >
        <ScrollView
          style={styles.modalScroll}
          contentContainerStyle={styles.modalScrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text variant="titleLarge" style={styles.modalTitle}>
            Nueva orden de mantenimiento
          </Text>

          <SegmentedButtons
            value={form.tipo}
            onValueChange={(value) => handleChangeType(value as OrderType)}
            style={styles.segmentedControl}
            buttons={[
              { value: 'correctiva', label: 'Correctiva' },
              { value: 'mejora', label: 'Mejora' },
            ]}
          />

          <TextInput
            label="Titulo"
            value={form.titulo}
            onChangeText={(value) => setForm((prev) => ({ ...prev, titulo: value }))}
            style={styles.modalSection}
            mode="outlined"
          />

          <TextInput
            label="Descripcion"
            value={form.descripcion}
            onChangeText={(value) => setForm((prev) => ({ ...prev, descripcion: value }))}
            style={styles.modalSection}
            mode="outlined"
            multiline
          />

          <SegmentedButtons
            value={form.prioridad}
            onValueChange={(value) => setForm((prev) => ({ ...prev, prioridad: value as OrderPriority }))}
            style={styles.segmentedControl}
            buttons={[
              { value: 'baja', label: 'Baja' },
              { value: 'media', label: 'Media' },
              { value: 'alta', label: 'Alta' },
              { value: 'critica', label: 'Critica' },
            ]}
          />

          <View style={styles.modalSection}>
            <Text variant="labelLarge" style={styles.selectorLabel}>
              Fecha programada (opcional)
            </Text>
            <Button
              mode="outlined"
              onPress={() => setShowDatePicker(true)}
              style={styles.selectorButton}
            >
              {form.fechaProgramada
                ? dayjs(form.fechaProgramada).format('DD/MM/YYYY')
                : 'Seleccionar fecha'}
            </Button>
            {form.fechaProgramada ? (
              <Button onPress={handleClearDate} compact style={styles.clearDateButton}>
                Quitar fecha
              </Button>
            ) : null}
          </View>

          {requiresSupervisor(form.tipo) && (
            <View style={styles.modalSection}>
              <Text variant="labelLarge" style={styles.selectorLabel}>
                Supervisor responsable
              </Text>
              <Button
                mode="outlined"
                onPress={() => setShowSupervisorSelector(true)}
                style={styles.selectorButton}
              >
                {selectedSupervisor ? selectedSupervisor.nombre_completo : 'Seleccionar supervisor'}
              </Button>
            </View>
          )}

          {requiresCollaborator(form.tipo) && (
            <View style={styles.modalSection}>
              <Text variant="labelLarge" style={styles.selectorLabel}>
                Colaborador del area
              </Text>
              <Button
                mode="outlined"
                onPress={() => setShowCollaboratorSelector(true)}
                style={styles.selectorButton}
              >
                {selectedCollaborator
                  ? selectedCollaborator.nombre_completo
                  : 'Seleccionar colaborador'}
              </Button>
            </View>
          )}

          <View style={styles.modalSection}>
            <Text variant="labelLarge" style={styles.selectorLabel}>
              Detalles especificos
            </Text>
            {ORDER_METADATA_FIELDS[form.tipo].map((field) => (
              <TextInput
                key={field.key}
                label={field.label}
                value={form.metadata[field.key]}
                onChangeText={(value) => handleMetadataChange(field.key, value)}
                mode="outlined"
                multiline={field.multiline}
                style={styles.metadataField}
              />
            ))}
          </View>

                {error && <HelperText type="error">{error}</HelperText>}

          <View style={styles.modalActions}>
            <Button onPress={onDismiss} disabled={loading}>
              Cancelar
            </Button>
            <Button mode="contained" onPress={handleSubmit} loading={loading}>
              Guardar orden
            </Button>
          </View>
        </ScrollView>
      </Modal>

      <CalendarPickerModal
        visible={showDatePicker}
        initialDate={form.fechaProgramada || undefined}
        onDismiss={() => setShowDatePicker(false)}
        onConfirm={handleDateSelected}
        onClear={form.fechaProgramada ? handleClearDate : undefined}
      />

      <Modal
        visible={showSupervisorSelector}
        onDismiss={() => setShowSupervisorSelector(false)}
        contentContainerStyle={styles.selectorModal}
      >
        <Text variant="titleMedium" style={styles.selectorTitle}>
          Seleccionar supervisor
        </Text>
        <Searchbar
          placeholder="Buscar supervisor"
          value={supervisorQuery}
          onChangeText={(text) => setSupervisorQuery(text)}
          style={styles.selectorSearch}
        />
        <View style={styles.selectorList}>
          <FlatList
            data={filteredSupervisors}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            ItemSeparatorComponent={Divider}
            renderItem={({ item }) => (
              <List.Item
                title={item.nombre_completo}
                description={item.email}
                onPress={() => {
                  setForm((prev) => ({ ...prev, supervisorId: item.id }));
                  setShowSupervisorSelector(false);
                }}
              />
            )}
            ListEmptyComponent={
              <Text style={styles.selectorEmpty}>No hay supervisores disponibles</Text>
            }
          />
        </View>
        <Button onPress={() => setShowSupervisorSelector(false)}>Cerrar</Button>
      </Modal>

      <Modal
        visible={showCollaboratorSelector}
        onDismiss={() => setShowCollaboratorSelector(false)}
        contentContainerStyle={styles.selectorModal}
      >
        <Text variant="titleMedium" style={styles.selectorTitle}>
          Seleccionar colaborador
        </Text>
        <Searchbar
          placeholder="Buscar colaborador"
          value={collaboratorQuery}
          onChangeText={(text) => setCollaboratorQuery(text)}
          style={styles.selectorSearch}
        />
        <View style={styles.selectorList}>
          <FlatList
            data={filteredCollaborators}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            ItemSeparatorComponent={Divider}
            renderItem={({ item }) => (
              <List.Item
                title={item.nombre_completo}
                description={item.email}
                onPress={() => {
                  setForm((prev) => ({ ...prev, colaboradorAreaId: item.id }));
                  setShowCollaboratorSelector(false);
                }}
              />
            )}
            ListEmptyComponent={
              <Text style={styles.selectorEmpty}>No hay colaboradores disponibles</Text>
            }
          />
        </View>
        <Button onPress={() => setShowCollaboratorSelector(false)}>Cerrar</Button>
      </Modal>
    </Portal>
  );
};

const OrdersScreen = ({ route }: any) => {
  console.log('[OrdersScreen] Component mounted/updated with route params:', route?.params);

  const { user } = useSelector((state: RootState) => state.auth);
  const [orders, setOrders] = useState<OrdenMtto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [showForm, setShowForm] = useState<boolean>(route?.params?.openForm || false);
  const [creatingOrder, setCreatingOrder] = useState<boolean>(false);
  const [executors, setExecutors] = useState<Usuario[]>([]);
  const [supervisors, setSupervisors] = useState<Usuario[]>([]);
  const [collaborators, setCollaborators] = useState<Usuario[]>([]);
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);

  console.log('[OrdersScreen] Initial showForm value from route:', route?.params?.openForm, 'final showForm:', showForm);

  // Debug logging for showForm state changes
  useEffect(() => {
    console.log('[OrdersScreen] showForm state changed to:', showForm);
  }, [showForm]);

  // Watch for route params changes
  useEffect(() => {
    console.log('[OrdersScreen] Route params changed:', route?.params);
    if (route?.params?.openForm) {
      console.log('[OrdersScreen] openForm param detected, setting showForm to true');
      setShowForm(true);
    }
  }, [route?.params]);

  const [completionOrder, setCompletionOrder] = useState<OrdenMtto | null>(null);
  const [completionNotes, setCompletionNotes] = useState('');
  const [completionResources, setCompletionResources] = useState('');
  const [completionLoading, setCompletionLoading] = useState(false);
  const [completionEvidences, setCompletionEvidences] = useState<
    Array<{
      uri: string;
      name: string;
      mimeType: string;
      tipo: 'imagen' | 'documento';
    }>
  >([]);
  const [uploadingEvidences, setUploadingEvidences] = useState(false);

  const [approvalOrder, setApprovalOrder] = useState<OrdenMtto | null>(null);
  const [approvalRating, setApprovalRating] = useState(5);
  const [approvalComments, setApprovalComments] = useState('');
  const [approvalLoading, setApprovalLoading] = useState(false);

  const [ratingOrder, setRatingOrder] = useState<OrdenMtto | null>(null);
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingComments, setRatingComments] = useState('');
  const [ratingLoading, setRatingLoading] = useState(false);

  const [detailOrder, setDetailOrder] = useState<OrdenMtto | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);

  const [treatmentOrder, setTreatmentOrder] = useState<OrdenMtto | null>(null);
  const [treatmentNotes, setTreatmentNotes] = useState('');
  const [treatmentLoading, setTreatmentLoading] = useState(false);
  const [treatmentCompleteOrder, setTreatmentCompleteOrder] = useState(false);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todos');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('todos');
  const [searchQuery, setSearchQuery] = useState('');

  const canCreateOrder = Boolean(user?.rol && hasPermission(user.rol, 'CREATE_ORDER'));
  const canAssignSelf = Boolean(user?.rol && hasPermission(user.rol, 'ASSIGN_SELF'));

  // Debug logs
  console.log('[OrdersScreen] User:', {
    rol: user?.rol,
    canCreateOrder,
    canAssignSelf,
  });

  const formatUserName = (value?: any) => {
    if (!value) return 'Sin datos';
    const parts = [
      value.nombre_completo,
      value.last_name,
      value.mother_last_name,
    ].filter(Boolean);
    const fullName = parts.join(' ').trim();
    return fullName || value.email || value.correo || 'Sin datos';
  };

  const fetchOrders = useCallback(
    async (options?: { silent?: boolean }) => {
      try {
        if (!options?.silent) {
          setLoading(true);
        }
        const data = await ordersService.list();
        setOrders(data);
      } catch (error: any) {
        console.error('Error loading orders', error);
        Alert.alert('Error', error.message ?? 'No se pudieron cargar las ordenes');
      } finally {
        if (!options?.silent) {
          setLoading(false);
        }
      }
    },
    []
  );

  const loadSupportData = useCallback(async () => {
    try {
      const [executorList, supervisorList, collaboratorList] = await Promise.all([
        userService.getActiveExecutors(),
        userService.getActiveSupervisors(),
        userService.getAreaCollaborators(),
      ]);
      setExecutors(executorList);
      setSupervisors(supervisorList);
      setCollaborators(collaboratorList);
    } catch (error) {
      console.error('Error loading support data for orders:', error);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    loadSupportData();
  }, [fetchOrders, loadSupportData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOrders({ silent: true });
    setRefreshing(false);
  }, [fetchOrders]);

  const statusCounts = useMemo(() => {
    return orders.reduce(
      (acc, order) => {
        acc[order.estado] += 1;
        return acc;
      },
      { pendiente: 0, en_proceso: 0, completado: 0 } as Record<OrderStatus, number>
    );
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Si es operador, solo mostrar sus órdenes (solicitadas, supervisadas o para aprobar)
      if (user?.rol === 'operacion') {
        const isSolicitante = order.solicitante_id === user.id;
        const isSupervisor = order.supervisor_id === user.id;
        const isAprobador = order.aprobador_id === user.id;
        if (!isSolicitante && !isSupervisor && !isAprobador) {
          return false;
        }
      }

      const statusMatch = statusFilter === 'todos' || order.estado === statusFilter;
      const typeMatch = typeFilter === 'todos' || order.tipo === typeFilter;

      // Text search filter
      let searchMatch = true;
      if (searchQuery.trim()) {
        const searchLower = searchQuery.toLowerCase();
        searchMatch =
          order.titulo?.toLowerCase().includes(searchLower) ||
          order.descripcion?.toLowerCase().includes(searchLower) ||
          order.id?.toLowerCase().includes(searchLower) ||
          order.metadata?.ubicacion?.toLowerCase().includes(searchLower) ||
          order.metadata?.equipo?.toLowerCase().includes(searchLower) ||
          false;
      }

      return statusMatch && typeMatch && searchMatch;
    });
  }, [orders, statusFilter, typeFilter, searchQuery, user]);

  const handleCreateOrder = useCallback(
    async (form: OrderFormState) => {
      if (!user) {
        Alert.alert('Sesion requerida', 'Debes iniciar sesion para crear ordenes.');
        return;
      }
      try {
        setCreatingOrder(true);
        const payload = {
          titulo: form.titulo.trim(),
          descripcion: form.descripcion.trim(),
          tipo: form.tipo,
          prioridad: form.prioridad,
          solicitanteId: user.id,
          fechaProgramada: form.fechaProgramada?.trim() || undefined,
          supervisorId: requiresSupervisor(form.tipo) ? form.supervisorId : undefined,
          colaboradorAreaId: requiresCollaborator(form.tipo) ? form.colaboradorAreaId : undefined,
          metadata: form.metadata,
        };
        const newOrder = await ordersService.create(payload);
        setOrders((prev) => [newOrder, ...prev]);
        setShowForm(false);
        await notificationService.sendOrderCreatedNotification(newOrder, executors);
      } catch (error: any) {
        console.error('Error creating order', error);
        Alert.alert('Error', error.message ?? 'No se pudo crear la orden');
      } finally {
        setCreatingOrder(false);
      }
    },
    [executors, user]
  );

  const handleAssignToMe = useCallback(
    (order: OrdenMtto, onSuccess?: (updated: OrdenMtto) => void) => {
      if (!user) {
        Alert.alert('Sesion requerida', 'Debes iniciar sesion para tomar ordenes.');
        return;
      }

      Alert.alert(
        'Tomar orden',
        '¿Deseas asignarte esta orden? A partir de ahora figurara como "En proceso".',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Tomar',
            onPress: async () => {
              try {
                setProcessingOrderId(order.id);
                const updated = await ordersService.assignToExecutor({
                  orderId: order.id,
                  executorId: user.id,
                });
                setOrders((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
                if (onSuccess) {
                  onSuccess(updated);
                }
                await notificationService.sendOrderAssignedNotification(updated, user);
              } catch (error: any) {
                console.error('Error assigning order', error);
                Alert.alert('Error', error.message ?? 'No se pudo tomar la orden');
              } finally {
                setProcessingOrderId(null);
              }
            },
          },
        ]
      );
    },
    [user]
  );

  const openCompletionDialog = (order: OrdenMtto) => {
    setCompletionOrder(order);
    setCompletionNotes(order.trabajos_realizados ?? '');
    setCompletionResources(order.recursos_utilizados ?? '');
    setCompletionEvidences([]);
  };

  const openOrderDetail = (order: OrdenMtto) => {
    // Convertir ambos a string para comparación segura
    const ejecutorIdStr = String(order.ejecutor_id || '');
    const userIdStr = String(user?.id || '');
    const esEjecutorAsignado = ejecutorIdStr === userIdStr && ejecutorIdStr !== '';

    console.log('[OrderDetail] Abriendo detalle de orden:', {
      id: order.id,
      folio: order.folio,
      estado: order.estado,
      ejecutor_id: order.ejecutor_id,
      ejecutor_id_str: ejecutorIdStr,
      user_id: user?.id,
      user_id_str: userIdStr,
      es_ejecutor_asignado: esEjecutorAsignado,
      puede_tratar: order.estado === 'en_proceso' && esEjecutorAsignado,
    });
    setDetailOrder(order);
    setDetailVisible(true);
  };

  const closeOrderDetail = () => {
    setDetailVisible(false);
    setDetailOrder(null);
  };

  useEffect(() => {
    if (!detailVisible) {
      setDetailOrder(null);
      return;
    }

    if (detailOrder) {
      const updated = orders.find((current) => current.id === detailOrder.id);
      if (updated && updated !== detailOrder) {
        setDetailOrder(updated);
      }
    }
  }, [orders, detailVisible, detailOrder]);

  const handleOpenTreatmentFromDetail = () => {
    if (!detailOrder) return;
    setTreatmentOrder(detailOrder);
    setTreatmentNotes(detailOrder.trabajos_realizados || '');
    setTreatmentCompleteOrder(false);
    closeOrderDetail();
  };

  const closeTreatmentDialog = () => {
    setTreatmentOrder(null);
    setTreatmentNotes('');
    setTreatmentCompleteOrder(false);
  };

  const handleSubmitTreatment = async () => {
    if (!user || !treatmentOrder) {
      return;
    }

    if (!treatmentNotes.trim()) {
      Alert.alert('Notas requeridas', 'Describe el avance o trabajo realizado.');
      return;
    }

    try {
      setTreatmentLoading(true);

      const updateData: any = {
        trabajos_realizados: treatmentNotes.trim(),
        updated_at: new Date().toISOString(),
      };

      // Si se marca como completada, actualizar el estado
      if (treatmentCompleteOrder) {
        updateData.estado = 'completado';
        updateData.fecha_finalizacion = new Date().toISOString();
      }

      // Actualizar la orden con las notas de tratamiento
      const { error } = await supabase
        .from('ordenesmtto')
        .update(updateData)
        .eq('id', treatmentOrder.id);

      if (error) throw error;

      const mensaje = treatmentCompleteOrder
        ? 'La orden ha sido completada exitosamente.'
        : 'Se ha registrado el avance del tratamiento.';

      Alert.alert('Éxito', mensaje);
      closeTreatmentDialog();
      await fetchOrders();
    } catch (error: any) {
      console.error('Error actualizando tratamiento:', error);
      Alert.alert('Error', error.message ?? 'No se pudo registrar el tratamiento');
    } finally {
      setTreatmentLoading(false);
    }
  };

  const handleRemoveEvidence = (index: number) => {
    setCompletionEvidences((prev) => prev.filter((_, idx) => idx !== index));
  };

  const ensureMediaLibraryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Se necesita acceso a la biblioteca para adjuntar evidencias.');
      return false;
    }
    return true;
  };

  const handleAddEvidenceImage = async () => {
    const hasPermission = await ensureMediaLibraryPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: false,
    });

    if (result.canceled || !result.assets?.length) {
      return;
    }

    const asset = result.assets[0];
    const extension = asset.fileName?.split('.').pop() || 'jpg';
    const fileName = asset.fileName || `evidencia_${Date.now()}.${extension}`;
    const mimeType = asset.mimeType || `image/${extension}`;

    setCompletionEvidences((prev) => [
      ...prev,
      {
        uri: asset.uri,
        name: fileName,
        mimeType,
        tipo: 'imagen',
      },
    ]);
  };

  const handleAddEvidenceDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      type: ['application/pdf', 'image/*'],
      multiple: false,
    });

    if (result.canceled) {
      return;
    }

    const asset = result.assets?.[0];
    if (!asset) {
      return;
    }

    const { uri, mimeType, name } = asset;
    const extension = name?.split('.').pop()?.toLowerCase();
    const resolvedMime =
      mimeType ||
      (extension === 'pdf'
        ? 'application/pdf'
        : extension
        ? `application/${extension}`
        : 'application/octet-stream');

    setCompletionEvidences((prev) => [
      ...prev,
      {
        uri,
        name: name || `documento_${Date.now()}`,
        mimeType: resolvedMime,
        tipo: resolvedMime.startsWith('image/') ? 'imagen' : 'documento',
      },
    ]);
  };

  const handleSubmitCompletion = async () => {
    if (!user || !completionOrder) {
      return;
    }

    if (!completionNotes.trim()) {
      Alert.alert('Datos requeridos', 'Describe los trabajos realizados antes de cerrar la orden.');
      return;
    }

    if (completionEvidences.length === 0) {
      Alert.alert('Evidencia requerida', 'Debes adjuntar al menos una evidencia (foto o documento).');
      return;
    }

    try {
      setCompletionLoading(true);
      setUploadingEvidences(true);

      const uploadedEvidences = [] as Array<{
        url: string;
        path: string;
        bucket: string;
        tipo: string;
        nombre: string;
      }>;

      for (const evidence of completionEvidences) {
        const upload = await storageService.uploadOrderEvidence(
          completionOrder.id,
          evidence.uri,
          evidence.name,
          evidence.mimeType
        );

        uploadedEvidences.push({
          url: upload.publicUrl,
          path: upload.path,
          bucket: upload.bucket,
          tipo: evidence.tipo,
          nombre: evidence.name,
        });
      }

      const updated = await ordersService.markCompleted({
        orderId: completionOrder.id,
        executorId: user.id,
        trabajosRealizados: completionNotes.trim(),
        recursosUtilizados: completionResources.trim() || undefined,
        evidencias: uploadedEvidences,
      });
      setOrders((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      if (updated.solicitante) {
        await notificationService.sendOrderCompletedNotification(updated, updated.solicitante);
      }
      setCompletionOrder(null);
      setCompletionNotes('');
      setCompletionResources('');
      setCompletionEvidences([]);
    } catch (error: any) {
      console.error('Error completing order', error);
      Alert.alert('Error', error.message ?? 'No se pudo completar la orden');
    } finally {
      setUploadingEvidences(false);
      setCompletionLoading(false);
    }
  };

  const openApprovalDialog = (order: OrdenMtto) => {
    setApprovalOrder(order);
    setApprovalRating(5);
    setApprovalComments('');
  };

  const handleSubmitApproval = async () => {
    if (!user || !approvalOrder) {
      return;
    }

    try {
      setApprovalLoading(true);
      const updated = await ordersService.submitApproval({
        orderId: approvalOrder.id,
        aprobadorId: user.id,
        aprobado: true,
        calificacion: approvalRating,
        comentarios: approvalComments.trim() || undefined,
      });
      setOrders((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setApprovalOrder(null);
    } catch (error: any) {
      console.error('Error approving order', error);
      Alert.alert('Error', error.message ?? 'No se pudo registrar el visto bueno');
    } finally {
      setApprovalLoading(false);
    }
  };

  const openSolicitanteRatingDialog = (order: OrdenMtto) => {
    setRatingOrder(order);
    setRatingValue(5);
    setRatingComments('');
  };

  const handleSubmitSolicitanteRating = async () => {
    if (!user || !ratingOrder) {
      return;
    }

    try {
      setRatingLoading(true);
      const updated = await ordersService.rateSolicitante({
        orderId: ratingOrder.id,
        executorId: user.id,
        calificacion: ratingValue,
        comentarios: ratingComments.trim() || undefined,
      });
      setOrders((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setRatingOrder(null);
    } catch (error: any) {
      console.error('Error rating requester', error);
      Alert.alert('Error', error.message ?? 'No se guardo la calificacion');
    } finally {
      setRatingLoading(false);
    }
  };

  const handleAcceptOrder = (order: OrdenMtto) => {
    setApprovalOrder(order);
    setApprovalRating(5);
    setApprovalComments('');
  };

  const handleRejectOrder = (order: OrdenMtto) => {
    Alert.alert(
      'Rechazar orden',
      '¿Estás seguro de que deseas rechazar esta orden? Volverá a estado "En proceso" para ser tratada nuevamente.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Rechazar',
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessingOrderId(order.id);
              await ordersService.rejectOrder(order.id);
              Alert.alert('Éxito', 'La orden ha sido rechazada y devuelta a proceso');
              await fetchOrders();
            } catch (error: any) {
              console.error('Error rejecting order:', error);
              Alert.alert('Error', error.message ?? 'No se pudo rechazar la orden');
            } finally {
              setProcessingOrderId(null);
            }
          },
        },
      ]
    );
  };

  const renderOrder = ({ item }: { item: OrdenMtto }) => {
    const isAssignedToCurrentUser = Boolean(user && item.ejecutor_id === user.id);
    const isPending = item.estado === 'pendiente';
    const canTake = canAssignSelf && isPending && !item.ejecutor_id;
    const canComplete =
      isAssignedToCurrentUser && item.estado === 'en_proceso' && user?.rol === 'ejecutor';
    const approverId = getApprovalOwnerId(item);
    const canApprove =
      Boolean(user && approverId && user.id === approverId) &&
      item.estado === 'completado' &&
      item.aprobacion_estado === 'pendiente';
    const canRateSolicitante =
      isAssignedToCurrentUser &&
      item.estado === 'completado' &&
      item.calificacion_solicitante == null &&
      (item.tipo === 'correctiva' || item.tipo === 'preventiva');

    // Operador puede aceptar/rechazar órdenes completadas que solicitó
    const canReceiveOrder =
      user?.rol === 'operacion' &&
      item.estado === 'completado' &&
      item.aprobacion_estado === 'pendiente' &&
      String(item.solicitante_id) === String(user.id);

    const isCompleted = item.estado === 'completado';

    return (
      <Card
        style={[
          styles.orderCard,
          isCompleted && styles.orderCardCompleted
        ]}
        mode="elevated"
        onPress={() => openOrderDetail(item)}
      >
        <Card.Content>
          <View style={styles.orderCardHeader}>
            <View style={styles.orderCardHeaderLeft}>
              <MaterialCommunityIcons
                name={ORDER_TYPE_ICONS[item.tipo]}
                size={28}
                color="#6200ee"
                style={styles.orderIcon}
              />
              <View>
                <Text variant="titleMedium" style={styles.orderTitle}>
                  {item.titulo}
                </Text>
                <Text variant="bodySmall" style={styles.orderSubtitle}>
                  {ORDER_TYPE_LABELS[item.tipo]} · {ORDER_PRIORITY_LABELS[item.prioridad]}
                </Text>
              </View>
            </View>
            <Chip
              style={styles.statusChip}
              textStyle={styles.statusChipText}
              selectedColor="#fff"
              selected
              compact
              mode="flat"
              icon={({ size, color }) => (
                <MaterialCommunityIcons name="information-outline" size={size} color={color} />
              )}
              onPress={() => openOrderDetail(item)}
              theme={{
                colors: { secondaryContainer: ORDER_STATUS_COLORS[item.estado] },
              }}
            >
              {ORDER_STATUS_LABELS[item.estado]}
            </Chip>
          </View>

          <Text variant="bodyMedium" style={styles.orderDescription}>
            {item.descripcion}
          </Text>

          <View style={styles.orderMetaRow}>
            <Text style={styles.metaLabel}>Solicitante:</Text>
            <Text style={styles.metaValue}>{formatUserName(item.solicitante)}</Text>
          </View>

          <View style={styles.orderMetaRow}>
            <Text style={styles.metaLabel}>Ejecutor asignado:</Text>
            <Text style={styles.metaValue}>
              {item.ejecutor ? formatUserName(item.ejecutor) : 'Sin asignar'}
            </Text>
          </View>

          <View style={styles.orderMetaRow}>
            <Text style={styles.metaLabel}>Programada:</Text>
            <Text style={styles.metaValue}>{formatDate(item.fecha_programada)}</Text>
          </View>

          {item.aprobacion_estado !== 'pendiente' && (
            <View style={styles.orderMetaRow}>
              <Text style={styles.metaLabel}>Visto bueno:</Text>
              <Text style={styles.metaValue}>
                {ORDER_STATUS_LABELS[item.estado]} · {item.calificacion_ejecucion ?? '-'} ★
              </Text>
            </View>
          )}

          {item.calificacion_solicitante && (
            <View style={styles.orderMetaRow}>
              <Text style={styles.metaLabel}>Calificacion al solicitante:</Text>
              <Text style={styles.metaValue}>{item.calificacion_solicitante} ★</Text>
            </View>
          )}
        </Card.Content>

        <View style={styles.actionButtons}>
          {canTake && (
            <Button
              mode="contained-tonal"
              onPress={() => handleAssignToMe(item)}
              loading={processingOrderId === item.id}
              style={styles.actionButton}
            >
              Tomar orden
            </Button>
          )}

          {canComplete && (
            <Button
              mode="contained-tonal"
              onPress={() => openCompletionDialog(item)}
              style={styles.actionButton}
            >
              Marcar completada
            </Button>
          )}

          {canApprove && (
            <Button
              mode="contained-tonal"
              onPress={() => openApprovalDialog(item)}
              style={styles.actionButton}
            >
              Dar visto bueno
            </Button>
          )}

          {canRateSolicitante && (
            <Button
              mode="outlined"
              onPress={() => openSolicitanteRatingDialog(item)}
              style={styles.actionButton}
            >
              Calificar solicitante
            </Button>
          )}

          {canReceiveOrder && (
            <>
              <Button
                mode="contained"
                icon="check-circle"
                onPress={() => handleAcceptOrder(item)}
                style={[styles.actionButton, styles.acceptButton]}
                buttonColor="#4caf50"
              >
                Aceptar
              </Button>
              <Button
                mode="outlined"
                icon="close-circle"
                onPress={() => handleRejectOrder(item)}
                style={[styles.actionButton, styles.rejectButton]}
                textColor="#d32f2f"
              >
                Rechazar
              </Button>
            </>
          )}
        </View>
      </Card>
    );
  };

  const renderHeader = () => (
    <View>
      <Card style={styles.headerCard} mode="elevated">
        <Card.Content>
          <View style={styles.cardIconContainer}>
            <MaterialCommunityIcons name="clipboard-text" size={48} color="#6200ee" />
          </View>
          <Text variant="headlineSmall" style={styles.headerTitle}>
            Ordenes de mantenimiento
          </Text>
          <Text variant="bodyMedium" style={styles.headerDescription}>
            Gestiona, asigna y da seguimiento a los distintos tipos de ordenes de mantenimiento
          </Text>
        </Card.Content>
      </Card>

      <Card style={styles.statusCard} mode="elevated">
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Estado de las ordenes
          </Text>
          <View style={styles.statusChips}>
            <Chip
              icon={({ size, color }) => (
                <MaterialCommunityIcons name="clock-time-four" size={size} color={color} />
              )}
              style={styles.chip}
            >
              Pendientes: {statusCounts.pendiente}
            </Chip>
            <Chip
              icon={({ size, color }) => (
                <MaterialCommunityIcons name="progress-clock" size={size} color={color} />
              )}
              style={styles.chip}
            >
              En proceso: {statusCounts.en_proceso}
            </Chip>
            <Chip
              icon={({ size, color }) => (
                <MaterialCommunityIcons name="check-circle" size={size} color={color} />
              )}
              style={styles.chip}
            >
              Completadas: {statusCounts.completado}
            </Chip>
          </View>
        </Card.Content>
      </Card>

      <View style={styles.filtersContainer}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Filtros
        </Text>

        <Searchbar
          placeholder="Buscar por título, descripción, ubicación..."
          onChangeText={(text) => setSearchQuery(text)}
          value={searchQuery}
          style={styles.searchBar}
        />

        <Text variant="labelLarge" style={styles.filterLabel}>
          Estado
        </Text>
        <SegmentedButtons
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as StatusFilter)}
          style={styles.segmentedControl}
          buttons={[
            { value: 'todos', label: 'Todos' },
            { value: 'pendiente', label: 'Pendientes' },
            { value: 'en_proceso', label: 'En proceso' },
            { value: 'completado', label: 'Completados' },
          ]}
        />

        <Text variant="labelLarge" style={styles.filterLabel}>
          Tipo
        </Text>
        <SegmentedButtons
          value={typeFilter}
          onValueChange={(value) => setTypeFilter(value as TypeFilter)}
          style={styles.segmentedControl}
          buttons={[
            { value: 'todos', label: 'Todos' },
            { value: 'correctiva', label: 'Correctivas' },
            { value: 'preventiva', label: 'Preventivas' },
            { value: 'mejora', label: 'Mejoras' },
            { value: 'predictiva', label: 'Predictivas' },
            { value: 'autonomo', label: 'Autonomos' },
          ]}
        />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        renderItem={renderOrder}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            {loading ? (
              <ActivityIndicator animating color="#6200ee" />
            ) : (
              <>
                <MaterialCommunityIcons name="clipboard-text-off" size={48} color="#b0b0b0" />
                <Text style={styles.emptyText}>No hay ordenes para los filtros seleccionados.</Text>
              </>
            )}
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6200ee" />
        }
      />

      {canCreateOrder && (
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={() => {
            console.log('[OrdersScreen] FAB pressed, opening form');
            setShowForm(true);
          }}
          label="Nueva orden"
          color="#ffffff"
        />
      )}

      {console.log('[OrdersScreen] About to render OrderFormModal with:', {
        visible: showForm,
        supervisorsCount: supervisors.length,
        collaboratorsCount: collaborators.length,
        loading: creatingOrder,
      })}

      <OrderFormModal
        visible={showForm}
        onDismiss={() => {
          console.log('[OrdersScreen] OrderFormModal onDismiss called');
          setShowForm(false);
        }}
        onSubmit={handleCreateOrder}
        loading={creatingOrder}
        supervisors={supervisors}
        collaborators={collaborators}
      />

      <Portal>
        <Dialog visible={detailVisible} onDismiss={closeOrderDetail} style={styles.detailDialog}>
          {detailOrder && (
            <>
              <Dialog.Title>{detailOrder.titulo}</Dialog.Title>
              <Dialog.Content style={styles.detailContent}>
                <ScrollView
                  style={styles.detailScroll}
                  contentContainerStyle={styles.detailScrollContent}
                  showsVerticalScrollIndicator={false}
                >
                  <View style={styles.detailHeader}>
                    <Chip
                      style={[
                        styles.detailStatusChip,
                        { backgroundColor: ORDER_STATUS_COLORS[detailOrder.estado] },
                      ]}
                      textStyle={styles.detailStatusText}
                      icon="playlist-check"
                    >
                      {ORDER_STATUS_LABELS[detailOrder.estado]}
                    </Chip>
                    <Chip style={styles.detailPriorityChip} icon="alert">
                      {ORDER_PRIORITY_LABELS[detailOrder.prioridad]}
                    </Chip>
                  </View>

                  <Text style={styles.detailDescription}>{detailOrder.descripcion}</Text>

                  <Divider style={styles.detailDivider} />

                  <View style={styles.detailInfoRow}>
                    <Text style={styles.detailLabel}>Tipo</Text>
                    <Text style={styles.detailValue}>{ORDER_TYPE_LABELS[detailOrder.tipo]}</Text>
                  </View>
                  <View style={styles.detailInfoRow}>
                    <Text style={styles.detailLabel}>Solicitante</Text>
                    <Text style={styles.detailValue}>{formatUserName(detailOrder.solicitante)}</Text>
                  </View>
                  <View style={styles.detailInfoRow}>
                    <Text style={styles.detailLabel}>Ejecutor</Text>
                    <Text style={styles.detailValue}>
                      {detailOrder.ejecutor ? formatUserName(detailOrder.ejecutor) : 'Sin asignar'}
                    </Text>
                  </View>
                  <View style={styles.detailInfoRow}>
                    <Text style={styles.detailLabel}>Supervisor</Text>
                    <Text style={styles.detailValue}>
                      {detailOrder.supervisor ? formatUserName(detailOrder.supervisor) : 'Sin asignar'}
                    </Text>
                  </View>
                  <View style={styles.detailInfoRow}>
                    <Text style={styles.detailLabel}>Programada</Text>
                    <Text style={styles.detailValue}>{formatDate(detailOrder.fecha_programada)}</Text>
                  </View>
                  <View style={styles.detailInfoRow}>
                    <Text style={styles.detailLabel}>Inicio</Text>
                    <Text style={styles.detailValue}>{formatDate(detailOrder.fecha_inicio)}</Text>
                  </View>
                  <View style={styles.detailInfoRow}>
                    <Text style={styles.detailLabel}>Finalización</Text>
                    <Text style={styles.detailValue}>{formatDate(detailOrder.fecha_finalizacion)}</Text>
                  </View>

                  {detailOrder.detalles && Object.keys(detailOrder.detalles).length > 0 && (
                    <View style={styles.detailSection}>
                      <Text style={styles.sectionHeading}>Detalles específicos</Text>
                      {Object.entries(detailOrder.detalles).map(([key, value]) => (
                        <View key={key} style={styles.detailMetadataRow}>
                          <Text style={styles.detailMetadataLabel}>{key}</Text>
                          <Text style={styles.detailMetadataValue}>{String(value ?? '')}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {detailOrder.trabajos_realizados && (
                    <View style={styles.detailSection}>
                      <Text style={styles.sectionHeading}>Trabajos realizados</Text>
                      <Text style={styles.detailValue}>{detailOrder.trabajos_realizados}</Text>
                    </View>
                  )}

                  {detailOrder.recursos_utilizados && (
                    <View style={styles.detailSection}>
                      <Text style={styles.sectionHeading}>Recursos utilizados</Text>
                      <Text style={styles.detailValue}>{detailOrder.recursos_utilizados}</Text>
                    </View>
                  )}

                  {detailOrder.evidencias && detailOrder.evidencias.length > 0 && (
                    <View style={styles.detailSection}>
                      <Text style={styles.sectionHeading}>Evidencias</Text>
                      <View style={styles.evidenceChipsContainer}>
                        {detailOrder.evidencias.map((evidence, index) => (
                          <Chip
                            key={`${evidence.path}-${index}`}
                            icon={evidence.tipo === 'imagen' ? 'image' : 'file-document'}
                            style={styles.evidenceChip}
                          >
                            {evidence.nombre}
                          </Chip>
                        ))}
                      </View>
                    </View>
                  )}
                </ScrollView>
              </Dialog.Content>
              <Dialog.Actions>
                {detailOrder.estado === 'pendiente' && canAssignSelf && !detailOrder.ejecutor_id && (
                  <Button
                    onPress={() =>
                      handleAssignToMe(detailOrder, (updated) => {
                        setDetailOrder(updated);
                      })
                    }
                    loading={processingOrderId === detailOrder.id}
                  >
                    Tomar orden
                  </Button>
                )}
                {detailOrder.estado === 'en_proceso' &&
                 String(detailOrder.ejecutor_id) === String(user?.id) &&
                 detailOrder.ejecutor_id != null && (
                  <Button
                    mode="contained"
                    onPress={handleOpenTreatmentFromDetail}
                    icon="clipboard-edit"
                  >
                    Tratar
                  </Button>
                )}
                <Button onPress={closeOrderDetail}>Cerrar</Button>
              </Dialog.Actions>
            </>
          )}
        </Dialog>

        <Dialog visible={Boolean(completionOrder)} onDismiss={() => setCompletionOrder(null)}>
          <Dialog.Title>Marcar orden como completada</Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView
              contentContainerStyle={styles.dialogScrollContent}
              keyboardShouldPersistTaps="handled"
            >
              <TextInput
                label="Trabajos realizados"
                value={completionNotes}
                onChangeText={setCompletionNotes}
                mode="outlined"
                multiline
                numberOfLines={4}
                style={styles.dialogInput}
                returnKeyType="done"
                blurOnSubmit={true}
              />
              <TextInput
                label="Recursos utilizados (opcional)"
                value={completionResources}
                onChangeText={setCompletionResources}
                mode="outlined"
                multiline
                numberOfLines={3}
                style={styles.dialogInput}
                returnKeyType="done"
                blurOnSubmit={true}
              />

            <View style={styles.evidenceSection}>
              <Text variant="labelLarge" style={styles.evidenceTitle}>
                Evidencias (obligatorio)
              </Text>
              {completionEvidences.length === 0 ? (
                <Text variant="bodySmall" style={styles.evidenceHelper}>
                  Adjunta al menos una fotografia o documento para respaldar el mantenimiento.
                </Text>
              ) : (
                <View style={styles.evidenceChipsContainer}>
                  {completionEvidences.map((file, index) => (
                    <Chip
                      key={`${file.uri}-${index}`}
                      icon={file.tipo === 'imagen' ? 'image' : 'file-document'}
                      onClose={() => handleRemoveEvidence(index)}
                      mode="outlined"
                      style={styles.evidenceChip}
                    >
                      {file.name}
                    </Chip>
                  ))}
                </View>
              )}
              <View style={styles.evidenceActions}>
                <Button
                  icon="camera"
                  mode="outlined"
                  onPress={handleAddEvidenceImage}
                  style={[styles.evidenceButton, styles.evidenceButtonSpacer]}
                >
                  Agregar foto
                </Button>
                <Button
                  icon="file-upload"
                  mode="outlined"
                  onPress={handleAddEvidenceDocument}
                  style={styles.evidenceButton}
                >
                  Adjuntar archivo
                </Button>
              </View>
            </View>
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button
              onPress={() => setCompletionOrder(null)}
              disabled={completionLoading || uploadingEvidences}
            >
              Cancelar
            </Button>
            <Button
              onPress={handleSubmitCompletion}
              loading={completionLoading || uploadingEvidences}
            >
              Confirmar
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={Boolean(approvalOrder)} onDismiss={() => setApprovalOrder(null)}>
          <Dialog.Title>Visto bueno del trabajo</Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView
              contentContainerStyle={styles.dialogScrollContent}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.ratingValueLabel}>Calificacion del trabajo</Text>
              <RatingSelector value={approvalRating} onChange={setApprovalRating} />
              <TextInput
                label="Comentarios (opcional)"
                value={approvalComments}
                onChangeText={setApprovalComments}
                mode="outlined"
                multiline
                numberOfLines={4}
                style={styles.dialogInput}
                returnKeyType="done"
                blurOnSubmit={true}
              />
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setApprovalOrder(null)} disabled={approvalLoading}>
              Cancelar
            </Button>
            <Button onPress={handleSubmitApproval} loading={approvalLoading}>
              Aprobar
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={Boolean(ratingOrder)} onDismiss={() => setRatingOrder(null)}>
          <Dialog.Title>Calificar al solicitante</Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView
              contentContainerStyle={styles.dialogScrollContent}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.ratingValueLabel}>Calificacion recibida</Text>
              <RatingSelector value={ratingValue} onChange={setRatingValue} />
              <TextInput
                label="Comentarios (opcional)"
                value={ratingComments}
                onChangeText={setRatingComments}
                mode="outlined"
                multiline
                numberOfLines={4}
                style={styles.dialogInput}
                returnKeyType="done"
                blurOnSubmit={true}
              />
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setRatingOrder(null)} disabled={ratingLoading}>
              Cancelar
            </Button>
            <Button onPress={handleSubmitSolicitanteRating} loading={ratingLoading}>
              Guardar
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={Boolean(treatmentOrder)} onDismiss={closeTreatmentDialog}>
          <Dialog.Title>Registrar avance de tratamiento</Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView
              contentContainerStyle={styles.dialogScrollContent}
              keyboardShouldPersistTaps="handled"
            >
              {treatmentOrder && (
                <>
                  <Text variant="bodyMedium" style={{ marginBottom: 16, color: '#666' }}>
                    Orden: {treatmentOrder.titulo}
                  </Text>
                  <TextInput
                    label="Trabajos realizados / Avances"
                    value={treatmentNotes}
                    onChangeText={setTreatmentNotes}
                    mode="outlined"
                    multiline
                    numberOfLines={6}
                    placeholder="Describe el avance del tratamiento, trabajos realizados, observaciones, etc."
                    style={styles.dialogInput}
                    returnKeyType="done"
                    blurOnSubmit={true}
                  />

                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                  <Checkbox
                    status={treatmentCompleteOrder ? 'checked' : 'unchecked'}
                    onPress={() => setTreatmentCompleteOrder(!treatmentCompleteOrder)}
                  />
                  <Text
                    variant="bodyMedium"
                    onPress={() => setTreatmentCompleteOrder(!treatmentCompleteOrder)}
                    style={{ flex: 1 }}
                  >
                    Marcar orden como Completada
                  </Text>
                </View>

                  <HelperText type="info">
                    {treatmentCompleteOrder
                      ? 'La orden cambiará a estado Completado y se registrará la fecha de finalización.'
                      : 'Esta información se guardará como parte del historial de la orden sin cambiar su estado.'}
                  </HelperText>
                </>
              )}
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={closeTreatmentDialog} disabled={treatmentLoading}>
              Cancelar
            </Button>
            <Button
              mode={treatmentCompleteOrder ? 'contained' : 'text'}
              onPress={handleSubmitTreatment}
              loading={treatmentLoading}
            >
              {treatmentCompleteOrder ? 'Completar orden' : 'Guardar avance'}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContent: {
    padding: 16,
    paddingBottom: 120,
  },
  headerCard: {
    marginBottom: 16,
    borderRadius: 12,
  },
  cardIconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  headerDescription: {
    textAlign: 'center',
    color: '#666',
  },
  statusCard: {
    marginBottom: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 12,
  },
  statusChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
  },
  filtersContainer: {
    marginBottom: 16,
  },
  searchBar: {
    marginBottom: 16,
    borderRadius: 12,
  },
  filterLabel: {
    marginBottom: 8,
  },
  segmentedControl: {
    marginBottom: 12,
  },
  orderCard: {
    marginBottom: 16,
    borderRadius: 12,
  },
  orderCardCompleted: {
    borderLeftWidth: 4,
    borderLeftColor: '#4caf50',
    backgroundColor: '#f1f8f4',
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  orderCardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  orderIcon: {
    marginRight: 12,
  },
  orderTitle: {
    fontWeight: '600',
    flexShrink: 1,
  },
  orderSubtitle: {
    color: '#666',
  },
  orderDescription: {
    color: '#555',
    marginBottom: 12,
  },
  orderMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  metaLabel: {
    color: '#777',
  },
  metaValue: {
    fontWeight: '600',
  },
  statusChip: {
    // El color se aplicará dinámicamente vía theme
  },
  statusChipText: {
    color: '#fff',
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  actionButton: {
    marginRight: 12,
    marginBottom: 8,
  },
  acceptButton: {
    minWidth: 120,
  },
  rejectButton: {
    minWidth: 120,
    borderColor: '#d32f2f',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#00bcd4', // Azul cielo (cyan)
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    marginTop: 12,
    color: '#777',
  },
  modalContent: {
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    maxHeight: '90%',
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  keyboardAvoidingView: {
    width: '100%',
  },
  modalInner: {
    width: '100%',
  },
  modalScroll: {
    flexGrow: 0,
  },
  modalScrollContent: {
    paddingBottom: 12,
    flexGrow: 1,
  },
  modalTitle: {
    fontWeight: '600',
    marginBottom: 16,
  },
  modalSection: {
    marginBottom: 12,
  },
  selectorLabel: {
    marginBottom: 6,
  },
  selectorButton: {
    alignSelf: 'flex-start',
  },
  clearDateButton: {
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  metadataField: {
    marginBottom: 10,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
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
    maxHeight: 260,
    marginBottom: 12,
  },
  selectorEmpty: {
    textAlign: 'center',
    color: '#777',
    paddingVertical: 16,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingValueLabel: {
    fontWeight: '600',
    marginBottom: 8,
  },
  dialogInput: {
    marginBottom: 12,
  },
  dialogScrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  evidenceSection: {
    marginTop: 8,
  },
  evidenceTitle: {
    fontWeight: '600',
    marginBottom: 8,
  },
  evidenceHelper: {
    color: '#777',
    marginBottom: 10,
  },
  evidenceChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  evidenceChip: {
    marginRight: 6,
    marginBottom: 6,
  },
  evidenceActions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 4,
  },
  evidenceButton: {
    flex: 1,
  },
  evidenceButtonSpacer: {
    marginRight: 8,
  },
  detailDialog: {
    maxHeight: '85%',
  },
  detailContent: {
    paddingBottom: 0,
  },
  detailScroll: {
    maxHeight: 360,
  },
  detailScrollContent: {
    paddingBottom: 12,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailStatusChip: {
    marginRight: 8,
  },
  detailStatusText: {
    color: '#fff',
    fontWeight: '600',
  },
  detailPriorityChip: {
    backgroundColor: '#f0f0ff',
  },
  detailTitle: {
    fontWeight: '700',
    marginBottom: 8,
  },
  detailDescription: {
    color: '#555',
  },
  detailDivider: {
    marginVertical: 12,
  },
  detailInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  detailLabel: {
    color: '#666',
  },
  detailValue: {
    fontWeight: '600',
    color: '#333',
  },
  detailSection: {
    marginTop: 12,
    paddingVertical: 4,
  },
  sectionHeading: {
    fontWeight: '600',
    marginBottom: 6,
  },
  detailMetadataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  detailMetadataLabel: {
    color: '#666',
  },
  detailMetadataValue: {
    color: '#333',
    flexShrink: 1,
    textAlign: 'right',
  },
});

export default OrdersScreen;
