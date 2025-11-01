
import React, { useEffect, useState } from 'react';
import { FlatList, View, StyleSheet, RefreshControl } from 'react-native';
import { Searchbar, Card, Text, Chip, Badge, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { inventoryService } from '../services/inventory.service';
import { ExistenciaPos } from '../types/inventory.types';

const formatCurrency = (value?: number | null) => {
  const numeric = Number(value ?? 0);
  return Number.isNaN(numeric) ? '0.00' : numeric.toFixed(2);
};

const InventoryScreen = () => {
  const [existencias, setExistencias] = useState<ExistenciaPos[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const loadExistencias = async () => {
    try {
      setLoading(true);
      const data = await inventoryService.getAll({
        searchTerm: searchQuery || undefined,
      });
      setExistencias(data);
    } catch (error) {
      console.error('Error loading existencias:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await loadExistencias();
      setInitialized(true);
    };
    init();
  }, []);

  useEffect(() => {
    if (!initialized) return;
    const handler = setTimeout(() => {
      loadExistencias();
    }, 300);

    return () => clearTimeout(handler);
  }, [searchQuery, initialized]);

  const onRefresh = () => {
    setRefreshing(true);
    loadExistencias();
  };

  const renderExistencia = ({ item }: { item: ExistenciaPos }) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={styles.productInfo}>
            <Text variant="titleMedium" style={styles.productName}>
              {item.productos_pos?.nombre || 'Producto sin nombre'}
            </Text>
            <Text variant="bodySmall" style={styles.productDescription}>
              {item.ubicaciones?.descripcion || `Ubicación #${item.id_ubicacion}`}
            </Text>
          </View>
          <Badge style={styles.stockBadge}>{item.stock}</Badge>
        </View>
        <View style={styles.cardFooter}>
          <Chip style={styles.chip}>
            <MaterialCommunityIcons name="tag" size={16} color="#6200ee" />
            <Text variant="labelSmall" style={styles.chipText}>
              ${formatCurrency(item.costo_unitario ?? item.productos_pos?.preciocompra)}
            </Text>
          </Chip>
          <Chip style={styles.chip}>
            <MaterialCommunityIcons name="package-variant" size={16} color="#6200ee" />
            <Text variant="labelSmall" style={styles.chipText}>
              Lote {item.id_lote || 'N/A'}
            </Text>
          </Chip>
        </View>
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
        placeholder="Buscar productos..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />
      
      <FlatList
        data={existencias}
        renderItem={renderExistencia}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchBar: {
    margin: 16,
    borderRadius: 12,
  },
  listContent: {
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  productDescription: {
    color: '#666',
  },
  stockBadge: {
    backgroundColor: '#6200ee',
    marginLeft: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 8,
  },
  chip: {
    backgroundColor: '#e0e0e0',
  },
  chipText: {
    marginLeft: 4,
  },
});

export default InventoryScreen;
