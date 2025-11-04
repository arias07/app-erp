import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import {
  Card,
  Text,
  Button,
  Chip,
  Portal,
  Dialog,
  TextInput,
  IconButton,
  ActivityIndicator,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { useNavigation } from '@react-navigation/native';
import { ordersService } from '../services/orders.service';
import { OrdenMtto, ORDER_STATUS_LABELS, ORDER_TYPE_LABELS } from '../types/order.types';
import dayjs from 'dayjs';

const HomeOperadorScreen = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const navigation = useNavigation();
  const [orders, setOrders] = useState<OrdenMtto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Estados para el diálogo de recepción/calificación
  const [selectedOrder, setSelectedOrder] = useState<OrdenMtto | null>(null);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [rating, setRating] = useState(5);
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchOrders = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const allOrders = await ordersService.list();

      // Filtrar órdenes donde el usuario actual es solicitante, supervisor o aprobador
      console.log('[HomeOperadorScreen] Current user ID:', user?.id, 'type:', typeof user?.id);

      // Debug: Ver todas las órdenes
      allOrders.forEach((order, index) => {
        console.log(`[HomeOperadorScreen] Order ${index}:`, {
          id: order.id,
          titulo: order.titulo,
          estado: order.estado,
          solicitante_id: order.solicitante_id,
          solicitante_id_type: typeof order.solicitante_id,
          supervisor_id: order.supervisor_id,
          aprobador_id: order.aprobador_id,
        });
      });

      const myOrders = allOrders.filter((order) => {
        // Convertir a string para comparación (IDs pueden venir como number o string)
        const userIdStr = String(user?.id);
        const isSolicitante = String(order.solicitante_id) === userIdStr;
        const isSupervisor = String(order.supervisor_id) === userIdStr;
        const isAprobador = String(order.aprobador_id) === userIdStr;
        return isSolicitante || isSupervisor || isAprobador;
      });

      console.log('[HomeOperadorScreen] Total orders:', allOrders.length);
      console.log('[HomeOperadorScreen] My orders:', myOrders.length);
      console.log('[HomeOperadorScreen] Completed pending approval:',
        myOrders.filter(o => o.estado === 'completado' && o.aprobacion_estado === 'pendiente' && o.solicitante_id === user?.id).length
      );

      setOrders(myOrders);
    } catch (error: any) {
      console.error('Error loading orders:', error);
      Alert.alert('Error', 'No se pudieron cargar las órdenes');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOrders(true);
    setRefreshing(false);
  }, [fetchOrders]);

  const handleNewOrder = () => {
    try {
      // @ts-ignore - DrawerNavigator type
      navigation.navigate('Orders', { openForm: true });
    } catch (error) {
      console.error('Navigation error:', error);
      Alert.alert('Error', 'No se pudo abrir la pantalla de órdenes');
    }
  };

  const handleAcceptOrder = (order: OrdenMtto) => {
    setSelectedOrder(order);
    setRating(5);
    setComments('');
    setShowRatingDialog(true);
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
              setSubmitting(true);
              await ordersService.rejectOrder(order.id);
              Alert.alert('Éxito', 'La orden ha sido rechazada y devuelta a proceso');
              await fetchOrders(true);
            } catch (error: any) {
              console.error('Error rejecting order:', error);
              Alert.alert('Error', error.message ?? 'No se pudo rechazar la orden');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const handleSubmitRating = async () => {
    if (!selectedOrder || !user) return;

    try {
      setSubmitting(true);
      await ordersService.submitApproval({
        orderId: selectedOrder.id,
        aprobadorId: user.id,
        aprobado: true,
        calificacion: rating,
        comentarios: comments.trim() || undefined,
      });

      Alert.alert('Éxito', 'Orden aprobada y calificada exitosamente');
      setShowRatingDialog(false);
      setSelectedOrder(null);
      await fetchOrders(true);
    } catch (error: any) {
      console.error('Error submitting rating:', error);
      Alert.alert('Error', error.message ?? 'No se pudo completar la calificación');
    } finally {
      setSubmitting(false);
    }
  };

  const getOrderStatusColor = (estado: string) => {
    const colors: Record<string, string> = {
      pendiente: '#ef6c00',
      en_proceso: '#1976d2',
      completado: '#388e3c',
    };
    return colors[estado] || '#666';
  };

  const canAcceptOrReject = (order: OrdenMtto) => {
    const result = (
      order.estado === 'completado' &&
      order.aprobacion_estado === 'pendiente' &&
      String(order.solicitante_id) === String(user?.id)
    );
    console.log('[HomeOperadorScreen] canAcceptOrReject check:', {
      orderId: order.id,
      estado: order.estado,
      aprobacion_estado: order.aprobacion_estado,
      solicitante_id: order.solicitante_id,
      user_id: user?.id,
      comparison: `${String(order.solicitante_id)} === ${String(user?.id)}`,
      result,
    });
    return result;
  };

  const formatDate = (date?: string | null) => {
    return date ? dayjs(date).format('DD/MM/YYYY HH:mm') : 'No definida';
  };

  const RatingSelector = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => (
    <View style={styles.ratingRow}>
      {[1, 2, 3, 4, 5].map((score) => (
        <IconButton
          key={score}
          icon={() => (
            <MaterialCommunityIcons
              name={score <= value ? 'star' : 'star-outline'}
              size={32}
              color="#f5b301"
            />
          )}
          onPress={() => onChange(score)}
        />
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Tarjeta de bienvenida */}
        <Card style={styles.welcomeCard}>
          <Card.Content>
            <View style={styles.welcomeContent}>
              <MaterialCommunityIcons name="hand-wave" size={40} color="#A3C400" />
              <Text variant="headlineMedium" style={styles.greeting}>
                ¡Bienvenido, Operador!
              </Text>
              <Text variant="bodyLarge" style={styles.userName}>
                {user?.nombre_completo}
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Botón de acceso rápido */}
        <Card style={styles.quickAccessCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Acceso Rápido
            </Text>
            <Button
              mode="contained"
              icon="plus-circle"
              onPress={handleNewOrder}
              style={styles.quickAccessButton}
              contentStyle={styles.quickAccessButtonContent}
            >
              Nueva Orden
            </Button>
          </Card.Content>
        </Card>

        {/* Lista de órdenes */}
        <Card style={styles.ordersCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Mis Órdenes ({orders.length})
            </Text>

            {loading ? (
              <ActivityIndicator animating style={styles.loader} />
            ) : orders.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="clipboard-text-off" size={48} color="#ccc" />
                <Text style={styles.emptyText}>No tienes órdenes registradas</Text>
              </View>
            ) : (
              orders.map((order) => (
                <Card key={order.id} style={styles.orderCard} mode="outlined">
                  <Card.Content>
                    <View style={styles.orderHeader}>
                      <View style={styles.orderTitleRow}>
                        <MaterialCommunityIcons
                          name="clipboard-text"
                          size={24}
                          color="#A3C400"
                          style={styles.orderIcon}
                        />
                        <Text variant="titleSmall" style={styles.orderTitle}>
                          {order.titulo}
                        </Text>
                      </View>
                      <Chip
                        style={[
                          styles.statusChip,
                          { backgroundColor: getOrderStatusColor(order.estado) },
                        ]}
                        textStyle={styles.statusChipText}
                      >
                        {ORDER_STATUS_LABELS[order.estado]}
                      </Chip>
                    </View>

                    <Text variant="bodySmall" style={styles.orderType}>
                      {ORDER_TYPE_LABELS[order.tipo]} • Folio #{order.folio}
                    </Text>

                    <Text variant="bodyMedium" style={styles.orderDescription} numberOfLines={2}>
                      {order.descripcion}
                    </Text>

                    <View style={styles.orderMeta}>
                      <Text variant="bodySmall" style={styles.metaText}>
                        Creada: {formatDate(order.created_at)}
                      </Text>
                      {order.ejecutor && (
                        <Text variant="bodySmall" style={styles.metaText}>
                          Ejecutor: {order.ejecutor.nombre_completo}
                        </Text>
                      )}
                    </View>

                    {canAcceptOrReject(order) && (
                      <View style={styles.receptionButtons}>
                        <Text variant="labelMedium" style={styles.receptionLabel}>
                          Recepción:
                        </Text>
                        <View style={styles.buttonRow}>
                          <Button
                            mode="contained"
                            icon="check-circle"
                            onPress={() => handleAcceptOrder(order)}
                            style={styles.acceptButton}
                            buttonColor="#388e3c"
                          >
                            Aceptar
                          </Button>
                          <Button
                            mode="outlined"
                            icon="close-circle"
                            onPress={() => handleRejectOrder(order)}
                            style={styles.rejectButton}
                            textColor="#d32f2f"
                          >
                            Rechazar
                          </Button>
                        </View>
                      </View>
                    )}

                    {order.aprobacion_estado === 'aprobado' && order.calificacion_ejecucion && (
                      <View style={styles.ratingDisplay}>
                        <Text variant="bodySmall" style={styles.ratingLabel}>
                          Calificación otorgada: {order.calificacion_ejecucion}
                        </Text>
                        <View style={styles.starsDisplay}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <MaterialCommunityIcons
                              key={star}
                              name={star <= (order.calificacion_ejecucion || 0) ? 'star' : 'star-outline'}
                              size={16}
                              color="#f5b301"
                            />
                          ))}
                        </View>
                      </View>
                    )}
                  </Card.Content>
                </Card>
              ))
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Diálogo de calificación */}
      <Portal>
        <Dialog
          visible={showRatingDialog}
          onDismiss={() => !submitting && setShowRatingDialog(false)}
        >
          <Dialog.Title>Calificar servicio</Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView
              contentContainerStyle={styles.dialogScrollContent}
              keyboardShouldPersistTaps="handled"
            >
              <Text variant="bodyMedium" style={styles.dialogText}>
                Por favor, califica el servicio recibido
              </Text>
              <RatingSelector value={rating} onChange={setRating} />
              <TextInput
                label="Comentarios (opcional)"
                value={comments}
                onChangeText={setComments}
                mode="outlined"
                multiline
                numberOfLines={4}
                style={styles.commentsInput}
                returnKeyType="done"
                blurOnSubmit={true}
              />
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setShowRatingDialog(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button onPress={handleSubmitRating} loading={submitting} mode="contained">
              Enviar
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  welcomeCard: {
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: '#E8F5CD', // Verde lima claro ERPHYX
  },
  welcomeContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  greeting: {
    fontWeight: 'bold',
    marginTop: 12,
    color: '#1E3B33', // Verde oscuro ERPHYX
  },
  userName: {
    marginTop: 4,
    color: '#666',
  },
  quickAccessCard: {
    marginBottom: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 12,
  },
  quickAccessButton: {
    marginTop: 8,
  },
  quickAccessButtonContent: {
    paddingVertical: 8,
  },
  ordersCard: {
    marginBottom: 16,
    borderRadius: 12,
  },
  loader: {
    marginVertical: 24,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    marginTop: 12,
    color: '#999',
    fontSize: 16,
  },
  orderCard: {
    marginBottom: 12,
    borderRadius: 8,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  orderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  orderIcon: {
    marginRight: 8,
  },
  orderTitle: {
    fontWeight: '600',
    flex: 1,
  },
  statusChip: {
    height: 32,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusChipText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 0,
    marginBottom: 0,
  },
  orderType: {
    color: '#666',
    marginBottom: 8,
  },
  orderDescription: {
    color: '#555',
    marginBottom: 8,
  },
  orderMeta: {
    marginTop: 4,
  },
  metaText: {
    color: '#777',
    marginBottom: 2,
  },
  receptionButtons: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  receptionLabel: {
    marginBottom: 8,
    fontWeight: '600',
    color: '#333',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    flex: 1,
  },
  rejectButton: {
    flex: 1,
    borderColor: '#d32f2f',
  },
  ratingDisplay: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  ratingLabel: {
    color: '#666',
    marginBottom: 4,
  },
  starsDisplay: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 12,
  },
  dialogText: {
    marginBottom: 8,
    textAlign: 'center',
  },
  commentsInput: {
    marginTop: 12,
  },
  dialogScrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
});

export default HomeOperadorScreen;
