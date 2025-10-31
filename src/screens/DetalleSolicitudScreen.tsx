import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Card, Text, ActivityIndicator, Chip, Divider, Button, List } from 'react-native-paper';
import dayjs from 'dayjs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { solicitudService } from '../services/solicitud.service';
import { SolicitudSKU, EstadoSolicitud } from '../types/solicitud.types';

const estadoColor = (estado: EstadoSolicitud) => {
  switch (estado) {
    case 'pendiente':
      return '#FFA726';
    case 'aprobada':
      return '#66BB6A';
    case 'rechazada':
      return '#EF5350';
    case 'completada':
      return '#42A5F5';
    case 'cancelada':
      return '#9E9E9E';
    default:
      return '#9E9E9E';
  }
};

const estadoLabel = (estado: EstadoSolicitud) => {
  switch (estado) {
    case 'pendiente':
      return 'Pendiente';
    case 'aprobada':
      return 'Aprobada';
    case 'rechazada':
      return 'Rechazada';
    case 'completada':
      return 'Completada';
    case 'cancelada':
      return 'Cancelada';
    default:
      return estado;
  }
};

const formatCurrency = (valor: number | null | undefined, divisa?: string | null) => {
  if (valor == null) return 'N/A';
  try {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: divisa || 'MXN',
      minimumFractionDigits: 2,
    }).format(valor);
  } catch {
    return `${valor} ${divisa || ''}`.trim();
  }
};

const estadoNormalizado = (estatus: string): EstadoSolicitud => {
  const normalized = (estatus || '').toUpperCase();
  return ESTADO_NORMALIZADO[normalized] ?? 'pendiente';
};

const ESTADO_NORMALIZADO: Record<string, EstadoSolicitud> = {
  POR_AUTORIZAR: 'pendiente',
  EN_REVISION: 'pendiente',
  AUTORIZADA: 'aprobada',
  APROBADA: 'aprobada',
  RECHAZADA: 'rechazada',
  COMPLETADA: 'completada',
  CANCELADA: 'cancelada',
};

const DetalleSolicitudScreen = ({ route, navigation }: any) => {
  const { solicitudId } = route.params;
  const [solicitud, setSolicitud] = useState<SolicitudSKU | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSolicitud = async () => {
    try {
      setLoading(true);
      const data = await solicitudService.getById(solicitudId);
      if (!data) {
        Alert.alert('Sin datos', 'La solicitud no está disponible.');
        navigation.goBack();
        return;
      }
      setSolicitud(data);
    } catch (error) {
      console.error('Error loading solicitud:', error);
      Alert.alert('Error', 'No se pudo cargar la solicitud.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSolicitud();
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator animating size="large" />
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

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.estadoRow}>
            <Chip style={[styles.estadoChip, { backgroundColor: estadoColor(solicitud.estado) }]}>
              <Text style={styles.estadoChipText}>{estadoLabel(solicitud.estado)}</Text>
            </Chip>
            <Text variant="bodyMedium">Folio: {solicitud.id}</Text>
          </View>

          <Text variant="titleLarge" style={styles.descripcion}>
            {solicitud.descripcion || `Solicitud ${solicitud.id}`}
          </Text>

          <Divider style={styles.divider} />

          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="calendar" size={18} color="#555" />
            <Text style={styles.infoValue}>
              {dayjs(solicitud.fecha).format('DD/MM/YYYY HH:mm')}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="currency-usd" size={18} color="#555" />
            <Text style={styles.infoValue}>
              Total: {formatCurrency(solicitud.total, solicitud.divisa)}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="account" size={18} color="#555" />
            <Text style={styles.infoValue}>
              Responsable: {solicitud.responsable?.nombre || 'Sin asignar'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="account-check" size={18} color="#555" />
            <Text style={styles.infoValue}>
              Autorizó: {solicitud.autorizado?.nombre || 'Sin asignar'}
            </Text>
          </View>

          {solicitud.motivo && (
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Motivo</Text>
              <Text style={styles.infoText}>{solicitud.motivo}</Text>
            </View>
          )}

          {solicitud.observaciones && (
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Observaciones</Text>
              <Text style={styles.infoText}>{solicitud.observaciones}</Text>
            </View>
          )}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Detalles
          </Text>
          <Divider style={styles.divider} />
          {solicitud.detalles.length === 0 ? (
            <Text style={styles.emptyText}>Sin detalles registrados.</Text>
          ) : (
            solicitud.detalles.map((detalle) => (
              <List.Item
                key={detalle.id}
                title={`Producto: ${detalle.id_producto ?? 'N/D'}`}
                description={`Proveedor: ${detalle.id_proveedor ?? 'N/D'} · Cantidad: ${
                  detalle.cantidad ?? 'N/D'
                }`}
                right={() => (
                  <Text style={styles.infoValue}>
                    {detalle.costo_unitario != null
                      ? formatCurrency(detalle.costo_unitario, solicitud.divisa)
                      : '—'}
                  </Text>
                )}
              />
            ))
          )}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Historial
          </Text>
          <Divider style={styles.divider} />
          {solicitud.historial.length === 0 ? (
            <Text style={styles.emptyText}>No hay historial disponible.</Text>
          ) : (
            solicitud.historial.map((evento) => (
              <List.Item
                key={evento.id}
                title={estadoLabel(estadoNormalizado(evento.estatus))}
                description={
                  `${dayjs(evento.fecha).format('DD/MM/YYYY HH:mm')} · ${
                    evento.usuario?.nombre || 'Sin usuario'
                  }` + (evento.comentario ? `\n${evento.comentario}` : '')
                }
                left={(props) => (
                  <List.Icon {...props} icon="clock-time-four" color="#6200ee" />
                )}
              />
            ))
          )}
        </Card.Content>
      </Card>

      <Button mode="outlined" onPress={loadSolicitud} style={styles.reloadButton}>
        Actualizar
      </Button>
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
    backgroundColor: '#f5f5f5',
  },
  card: {
    marginBottom: 16,
    borderRadius: 12,
  },
  estadoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  estadoChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  estadoChipText: {
    color: '#fff',
    fontWeight: '600',
  },
  descripcion: {
    fontWeight: '600',
    marginBottom: 12,
  },
  divider: {
    marginVertical: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  infoValue: {
    color: '#555',
  },
  infoBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  infoLabel: {
    fontWeight: '600',
    marginBottom: 6,
  },
  infoText: {
    color: '#555',
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  emptyText: {
    textAlign: 'center',
    color: '#777',
    marginTop: 12,
  },
  reloadButton: {
    marginTop: 8,
    marginBottom: 24,
  },
});

export default DetalleSolicitudScreen;
