
import React, { useEffect, useState } from 'react';
import { FlatList, View, StyleSheet, RefreshControl } from 'react-native';
import {
  Searchbar,
  Card,
  Text,
  Chip,
  FAB,
  Badge,
  ActivityIndicator,
  SegmentedButtons,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { solicitudService } from '../services/solicitud.service';
import { SolicitudSKU, EstadoSolicitud } from '../types/solicitud.types';

const SolicitudesScreen = ({ navigation }: any) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const supervisorRoles = new Set(['superadmin', 'administrador', 'supervisor']);
  const isSupervisor = supervisorRoles.has(user?.rol || '');

  const [solicitudes, setSolicitudes] = useState<SolicitudSKU[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState<EstadoSolicitud | 'todas'>('todas');

  const loadSolicitudes = async () => {
    try {
      setLoading(true);
      let data: SolicitudSKU[];

      if (isSupervisor) {
        data = await solicitudService.getAll({
          estado: filtroEstado !== 'todas' ? filtroEstado : undefined,
          searchTerm: searchQuery || undefined,
        });
      } else {
        data = await solicitudService.getMisSolicitudes(user!.id);
        
        if (filtroEstado !== 'todas') {
          data = data.filter((s) => s.estado === filtroEstado);
        }
        if (searchQuery) {
          const searchLower = searchQuery.toLowerCase();
          data = data.filter(
            (s) =>
              s.productos_pos?.nombre?.toLowerCase().includes(searchLower) ||
              s.productos_pos?.sku?.toLowerCase().includes(searchLower)
          );
        }
      }

      setSolicitudes(data);
    } catch (error) {
      console.error('Error loading solicitudes:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadSolicitudes();
  }, [filtroEstado]);

  const onRefresh = () => {
    setRefreshing(true);
    loadSolicitudes();
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

  const getTipoIcon = (tipo: string) => {
    return tipo === 'salida' ? 'arrow-up-bold' : 'swap-horizontal';
  };

  const renderSolicitud = ({ item }: { item: SolicitudSKU }) => (
    <Card
      style={styles.card}
      onPress={() => navigation.navigate('DetalleSolicitud', { solicitudId: item.id })}
    >
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={styles.productInfo}>
            <View style={styles.titleRow}>
              <MaterialCommunityIcons
                name={getTipoIcon(item.tipo)}
                size={20}
                color="#6200ee"
                style={styles.tipoIcon}
              />
              <Text variant="titleMedium" style={styles.productName}>
                {item.productos_pos?.nombre || 'Producto sin nombre'}
              </Text>
            </View>
            <Text variant="bodySmall" style={styles.productDescription}>
              SKU: {item.productos_pos?.sku || 'N/A'}
            </Text>
            <Text variant="bodySmall" style={styles.productDescription}>
              Origen: {item.ubicacion_origen?.nombre || 'N/A'}
            </Text>
            {item.tipo === 'transferencia' && (
              <Text variant="bodySmall" style={styles.productDescription}>
                Destino: {item.ubicacion_destino?.nombre || 'N/A'}
              </Text>
            )}
          </View>
          <View style={styles.rightInfo}>
            <Badge
              style={[styles.estadoBadge, { backgroundColor: getEstadoColor(item.estado) }]}
            >
              {getEstadoLabel(item.estado)}
            </Badge>
            <Badge style={styles.cantidadBadge}>{item.cantidad}</Badge>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Chip style={styles.chip} icon="account">
            <Text variant="labelSmall">{item.solicitante?.nombre_completo}</Text>
          </Chip>
          <Chip style={styles.chip} icon="calendar">
            <Text variant="labelSmall">
              {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </Chip>
        </View>

        {item.motivo && (
          <View style={styles.motivoContainer}>
            <Text variant="bodySmall" style={styles.motivoLabel}>
              Motivo:
            </Text>
            <Text variant="bodySmall" style={styles.motivoText}>
              {item.motivo}
            </Text>
          </View>
        )}
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator animating={true} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Buscar por producto o SKU"
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
        onSubmitEditing={loadSolicitudes}
      />

      <SegmentedButtons
        value={filtroEstado}
        onValueChange={(value) => setFiltroEstado(value as EstadoSolicitud | 'todas')}
        buttons={[
          { value: 'todas', label: 'Todas' },
          { value: 'pendiente', label: 'Pendientes' },
          { value: 'aprobada', label: 'Aprobadas' },
          { value: 'completada', label: 'Completadas' },
        ]}
        style={styles.segmentedButtons}
      />

      <FlatList
        data={solicitudes}
        renderItem={renderSolicitud}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="file-document-outline" size={64} color="#ccc" />
            <Text variant="bodyLarge" style={styles.emptyText}>
              No hay solicitudes
            </Text>
          </View>
        }
      />

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('CreateSolicitud')}
        label="Nueva Solicitud"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBar: {
    margin: 16,
    marginBottom: 8,
  },
  segmentedButtons: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  card: {
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  productInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  tipoIcon: {
    marginRight: 8,
  },
  productName: {
    flex: 1,
    fontWeight: 'bold',
  },
  productDescription: {
    color: '#666',
    marginTop: 2,
  },
  rightInfo: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  estadoBadge: {
    marginBottom: 8,
  },
  cantidadBadge: {
    backgroundColor: '#6200ee',
  },
  cardFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    marginRight: 8,
  },
  motivoContainer: {
    marginTop: 12,
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },
  motivoLabel: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  motivoText: {
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    marginTop: 16,
    color: '#999',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default SolicitudesScreen;
