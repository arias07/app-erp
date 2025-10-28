import React, { useEffect, useState } from 'react';
import { FlatList, View, StyleSheet } from 'react-native';
import { Searchbar, Card, Text, Chip, FAB } from 'react-native-paper';
import { inventoryService } from '../../services/inventory.service';
import { ExistenciaPos } from '../../types/inventory.types';
import { useNavigation } from '@react-navigation/native';

export const InventoryListScreen = () => {
  const [inventarios, setInventarios] = useState<ExistenciaPos[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<any>();

  const loadInventarios = async () => {
    try {
      setLoading(true);
      const data = await inventoryService.getAll({
        searchTerm: searchQuery || undefined,
      });
      setInventarios(data);
    } catch (error) {
      console.error('Error loading inventarios:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventarios();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadInventarios();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const renderItem = ({ item }: { item: ExistenciaPos }) => {
    const producto = item.productos_pos;
    const ubicacion = item.ubicaciones?.nombre || `Ubicación #${item.id_ubicacion}`;
    const cantidadActual = item.stock;
    const cantidadMinima = producto?.stock_minimo ?? 0;
    const unidadMedida = producto?.unidad_medida || 'unid';
    const categoria = producto?.categoria || 'Sin categoría';

    return (
      <Card
        style={styles.card}
        onPress={() => navigation.navigate('InventoryDetail', { id: item.id })}
      >
        <Card.Content>
          <View style={styles.cardHeader}>
            <Text variant="titleMedium" style={styles.itemName}>
              {producto?.nombre || 'Producto sin nombre'}
            </Text>
            <Chip
              mode="flat"
              style={[
                styles.chip,
                {
                  backgroundColor:
                    cantidadActual <= cantidadMinima ? '#ffebee' : '#e8f5e9',
                },
              ]}
            >
              {cantidadActual} {unidadMedida}
            </Chip>
          </View>
          <Text variant="bodyMedium" style={styles.sku}>
            SKU: {producto?.sku || 'N/A'}
          </Text>
          <Text variant="bodySmall" numberOfLines={2} style={styles.description}>
            {producto?.descripcion || 'Sin descripción'}
          </Text>
          <View style={styles.footer}>
            <Text variant="bodySmall">{categoria}</Text>
            <Text variant="bodySmall">{ubicacion}</Text>
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Buscar por nombre, SKU o descripción"
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

      <FlatList
        data={inventarios}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        refreshing={loading}
        onRefresh={loadInventarios}
        contentContainerStyle={styles.list}
      />

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('InventoryCreate')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchbar: {
    margin: 16,
  },
  list: {
    padding: 16,
  },
  card: {
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemName: {
    flex: 1,
    fontWeight: 'bold',
  },
  chip: {
    marginLeft: 8,
  },
  sku: {
    opacity: 0.7,
    marginBottom: 4,
  },
  description: {
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
});
