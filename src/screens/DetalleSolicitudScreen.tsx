
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  Card,
  Text,
  Button,
  ActivityIndicator,
  Divider,
  TextInput,
  Portal,
  Dialog,
  Chip,
  Badge,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { solicitudService } from '../services/solicitud.service';
import { SolicitudSKU, EstadoSolicitud } from '../types/solicitud.types';

const DetalleSolicitudScreen = ({ route, navigation }: any) => {
  const { solicitudId } = route.params;
  const { user } = useSelector((state: RootState) => state.auth);
  const supervisorRoles = new Set(['superadmin', 'administrador', 'supervisor']);
  const isSupervisor = supervisorRoles.has(user?.rol || '');

  const [solicitud, setSolicitud] = useState<SolicitudSKU | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Diálogos
  const [showAprobarDialog, setShowAprobarDialog] = useState(false);
  const [showRechazarDialog, setShowRechazarDialog] = useState(false);
  const [showCompletarDialog, setShowCompletarDialog] = useState(false);
  const [observaciones, setObservaciones] = useState('');

  useEffect(() => {
    loadSolicitud();
  }, []);

  const loadSolicitud = async () => {
    try {
      setLoading(true);
      const data = await solicitudService.getById(solicitudId);
      setSolicitud(data);
    } catch (error) {
      console.error('Error loading solicitud:', error);
      Alert.alert('Error', 'No se pudo cargar la solicitud');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleAprobar = async () => {
    try {
      setActionLoading(true);
      await solicitudService.aprobar(solicitudId, user!.id, observaciones || undefined);
      Alert.alert('Éxito', 'Solicitud aprobada correctamente', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al aprobar la solicitud');
    } finally {
      setActionLoading(false);
      setShowAprobarDialog(false);
      setObservaciones('');
    }
  };

  const handleRechazar = async () => {
    if (!observaciones.trim()) {
      Alert.alert('Error', 'Debe proporcionar un motivo de rechazo');
      return;
    }

    try {
      setActionLoading(true);
      await solicitudService.rechazar(solicitudId, user!.id, observaciones);
      Alert.alert('Solicitud rechazada', 'La solicitud ha sido rechazada', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al rechazar la solicitud');
    } finally {
      setActionLoading(false);
      setShowRechazarDialog(false);
      setObservaciones('');
    }
  };

  const handleCompletar = async () => {
    try {
      setActionLoading(true);
      await solicitudService.completar(solicitudId);
      Alert.alert('Éxito', 'Movimiento de inventario completado', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al completar la solicitud');
    } finally {
      setActionLoading(false);
      setShowCompletarDialog(false);
    }
  };

  const getEstadoColor = (estado: EstadoSolicitud) => {
    switch (estado) {
      case 'pendiente':
        return '#FFA726';
      case 'aprobada':
        return '#66BB6A';
      case 'rechazada':
        return '#EF5350';
      case 'completada':
        return '#42A5F5';
      default:
        return '#9E9E9E';
    }
  };

  const getEstadoLabel = (estado: EstadoSolicitud) => {
    switch (estado) {
      case 'pendiente':
        return 'Pendiente';
      case 'aprobada':
        return 'Aprobada';
      case 'rechazada':
        return 'Rechazada';
      case 'completada':
        return 'Completada';
      default:
        return estado;
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator animating={true} size="large" />
      </View>
    );
  }

  if (!solicitud) {
    return (
      <View style={styles.centered}>
        <Text>Solicitud no encontrada</Text>
      </View>
    );
  }

  const canAprobar = isSupervisor && solicitud.estado === 'pendiente';
  const canCompletar = isSupervisor && solicitud.estado === 'aprobada';

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          {/* Estado */}
          <View style={styles.estadoContainer}>
            <Badge
              size={32}
              style={[styles.estadoBadge, { backgroundColor: getEstadoColor(solicitud.estado) }]}
            >
              {getEstadoLabel(solicitud.estado)}
            </Badge>
            <Chip
              icon={solicitud.tipo === 'salida' ? 'arrow-up-bold' : 'swap-horizontal'}
              style={styles.tipoChip}
            >
              {solicitud.tipo === 'salida' ? 'Salida' : 'Transferencia'}
            </Chip>
          </View>

          <Divider style={styles.divider} />

          {/* Información del Producto */}
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Producto
            </Text>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="package-variant" size={20} color="#666" />
              <View style={styles.infoContent}>
                <Text variant="bodyLarge" style={styles.infoLabel}>
                  {solicitud.productos_pos?.nombre}
                </Text>
                <Text variant="bodySmall" style={styles.infoValue}>
                  SKU: {solicitud.productos_pos?.sku}
                </Text>
              </View>
            </View>
          </View>

          <Divider style={styles.divider} />

          {/* Cantidad */}
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Cantidad
            </Text>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="counter" size={20} color="#666" />
              <View style={styles.infoContent}>
                <Text variant="headlineMedium" style={styles.cantidadText}>
                  {solicitud.cantidad}
                </Text>
                <Text variant="bodySmall" style={styles.infoValue}>
                  {solicitud.productos_pos?.unidad_medida || 'unidades'}
                </Text>
              </View>
            </View>
          </View>

          <Divider style={styles.divider} />

          {/* Ubicaciones */}
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Ubicaciones
            </Text>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="warehouse" size={20} color="#666" />
              <View style={styles.infoContent}>
                <Text variant="bodySmall" style={styles.infoLabel}>
                  Origen
                </Text>
                <Text variant="bodyLarge" style={styles.infoValue}>
                  {solicitud.ubicacion_origen?.nombre}
                </Text>
              </View>
            </View>
            {solicitud.tipo === 'transferencia' && solicitud.ubicacion_destino && (
              <View style={[styles.infoRow, { marginTop: 12 }]}>
                <MaterialCommunityIcons name="warehouse" size={20} color="#666" />
                <View style={styles.infoContent}>
                  <Text variant="bodySmall" style={styles.infoLabel}>
                    Destino
                  </Text>
                  <Text variant="bodyLarge" style={styles.infoValue}>
                    {solicitud.ubicacion_destino.nombre}
                  </Text>
                </View>
              </View>
            )}
          </View>

          <Divider style={styles.divider} />

          {/* Solicitante */}
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Solicitante
            </Text>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="account" size={20} color="#666" />
              <View style={styles.infoContent}>
                <Text variant="bodyLarge" style={styles.infoValue}>
                  {solicitud.solicitante?.nombre_completo}
                </Text>
                <Text variant="bodySmall" style={styles.infoLabel}>
                  {solicitud.solicitante?.email}
                </Text>
                <Text variant="bodySmall" style={styles.infoLabel}>
                  Rol: {solicitud.solicitante?.rol}
                </Text>
              </View>
            </View>
          </View>

          {/* Aprobador (si existe) */}
          {solicitud.aprobador && (
            <>
              <Divider style={styles.divider} />
              <View style={styles.section}>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Aprobador
                </Text>
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="account-check" size={20} color="#666" />
                  <View style={styles.infoContent}>
                    <Text variant="bodyLarge" style={styles.infoValue}>
                      {solicitud.aprobador.nombre_completo}
                    </Text>
                    <Text variant="bodySmall" style={styles.infoLabel}>
                      {solicitud.aprobador.email}
                    </Text>
                    {solicitud.fecha_aprobacion && (
                      <Text variant="bodySmall" style={styles.infoLabel}>
                        Fecha: {new Date(solicitud.fecha_aprobacion).toLocaleString()}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            </>
          )}

          {/* Motivo */}
          {solicitud.motivo && (
            <>
              <Divider style={styles.divider} />
              <View style={styles.section}>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Motivo
                </Text>
                <Text variant="bodyMedium" style={styles.motivoText}>
                  {solicitud.motivo}
                </Text>
              </View>
            </>
          )}

          {/* Acciones */}
          {canAprobar && (
            <View style={styles.actionsContainer}>
              <Button
                mode="contained"
                onPress={() => setShowAprobarDialog(true)}
                style={styles.actionButton}
              >
                Aprobar
              </Button>
              <Button
                mode="outlined"
                onPress={() => setShowRechazarDialog(true)}
                style={[styles.actionButton, styles.rechazarButton]}
              >
                Rechazar
              </Button>
            </View>
          )}

          {canCompletar && (
            <View style={styles.actionsContainer}>
              <Button
                mode="contained"
                onPress={() => setShowCompletarDialog(true)}
                style={styles.actionButton}
              >
                Completar Movimiento
              </Button>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Diálogo Aprobar */}
      <Portal>
        <Dialog visible={showAprobarDialog} onDismiss={() => setShowAprobarDialog(false)}>
          <Dialog.Title>Aprobar Solicitud</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Observaciones (opcional)"
              value={observaciones}
              onChangeText={setObservaciones}
              multiline
              numberOfLines={4}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowAprobarDialog(false)}>Cancelar</Button>
            <Button
              onPress={handleAprobar}
              disabled={actionLoading}
              loading={actionLoading}
            >
              Aprobar
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Diálogo Rechazar */}
      <Portal>
        <Dialog visible={showRechazarDialog} onDismiss={() => setShowRechazarDialog(false)}>
          <Dialog.Title>Rechazar Solicitud</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Motivo del rechazo"
              value={observaciones}
              onChangeText={setObservaciones}
              multiline
              numberOfLines={4}
              error={!observaciones.trim()}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowRechazarDialog(false)}>Cancelar</Button>
            <Button
              onPress={handleRechazar}
              disabled={actionLoading || !observaciones.trim()}
              loading={actionLoading}
            >
              Rechazar
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Diálogo Completar */}
      <Portal>
        <Dialog visible={showCompletarDialog} onDismiss={() => setShowCompletarDialog(false)}>
          <Dialog.Title>Completar Movimiento</Dialog.Title>
          <Dialog.Content>
            <Text>¿Está seguro que desea completar este movimiento?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowCompletarDialog(false)}>Cancelar</Button>
            <Button
              onPress={handleCompletar}
              disabled={actionLoading}
              loading={actionLoading}
            >
              Completar
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    marginBottom: 16,
  },
  estadoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  estadoBadge: {
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  tipoChip: {
    marginLeft: 8,
  },
  divider: {
    marginVertical: 12,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    color: '#666',
  },
  infoValue: {
    color: '#333',
  },
  cantidadText: {
    color: '#333',
  },
  motivoText: {
    color: '#333',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    marginRight: 8,
  },
  rechazarButton: {
    marginLeft: 8,
  },
});

export default DetalleSolicitudScreen;
