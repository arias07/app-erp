
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  TextInput,
  Button,
  SegmentedButtons,
  Text,
  ActivityIndicator,
  Searchbar,
  List,
  Portal,
  Modal,
  Divider,
  IconButton,
} from 'react-native-paper';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { solicitudService } from '../services/solicitud.service';
import { inventoryService } from '../services/inventory.service';
import { supabase } from '../services/supabase';
import { ExistenciaPos } from '../types/inventory.types';

interface Ubicacion {
  id: number;
  nombre: string;
}

const CreateSolicitudScreen = ({ navigation }: any) => {
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [tipo, setTipo] = useState<'salida' | 'transferencia'>('salida');
  const [cantidad, setCantidad] = useState('');
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Producto seleccionado
  const [productoSeleccionado, setProductoSeleccionado] = useState<ExistenciaPos | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [productos, setProductos] = useState<ExistenciaPos[]>([]);
  const [showProductModal, setShowProductModal] = useState(false);
  
  // Ubicaciones
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [ubicacionOrigen, setUbicacionOrigen] = useState<Ubicacion | null>(null);
  const [ubicacionDestino, setUbicacionDestino] = useState<Ubicacion | null>(null);
  const [showUbicacionOrigenModal, setShowUbicacionOrigenModal] = useState(false);
  const [showUbicacionDestinoModal, setShowUbicacionDestinoModal] = useState(false);

  useEffect(() => {
    loadUbicaciones();
  }, []);

  useEffect(() => {
    if (searchQuery.length > 2) {
      searchProductos();
    }
  }, [searchQuery]);

  const loadUbicaciones = async () => {
    try {
      const { data, error } = await supabase
        .from('ubicaciones')
        .select('id, nombre')
        .order('nombre');

      if (error) throw error;
      setUbicaciones(data || []);
    } catch (error) {
      console.error('Error loading ubicaciones:', error);
    }
  };

  const searchProductos = async () => {
    try {
      const data = await inventoryService.getAll({ searchTerm: searchQuery });
      setProductos(data);
    } catch (error) {
      console.error('Error searching productos:', error);
    }
  };

  const handleSubmit = async () => {
    Alert.alert(
      'Función no disponible',
      'La creación de solicitudes se gestiona directamente desde el ERP.'
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text variant="titleLarge" style={styles.title}>
          Nueva Solicitud
        </Text>

        {/* Tipo de solicitud */}
        <Text variant="labelLarge" style={styles.label}>
          Tipo de Solicitud
        </Text>
        <SegmentedButtons
          value={tipo}
          onValueChange={(value) => setTipo(value as 'salida' | 'transferencia')}
          buttons={[
            { value: 'salida', label: 'Salida' },
            { value: 'transferencia', label: 'Transferencia' },
          ]}
          style={styles.segmented}
        />

        {/* Producto */}
        <Text variant="labelLarge" style={styles.label}>
          Producto *
        </Text>
        <Button
          mode="outlined"
          onPress={() => setShowProductModal(true)}
          style={styles.selectButton}
        >
          {productoSeleccionado
            ? `${productoSeleccionado.productos_pos?.nombre} (${productoSeleccionado.productos_pos?.sku})`
            : 'Seleccionar Producto'}
        </Button>

        {/* Almacén de origen */}
        <Text variant="labelLarge" style={styles.label}>
          Almacén de Origen *
        </Text>
        <Button
          mode="outlined"
          onPress={() => setShowUbicacionOrigenModal(true)}
          style={styles.selectButton}
        >
          {ubicacionOrigen ? ubicacionOrigen.nombre : 'Seleccionar Almacén'}
        </Button>

        {/* Almacén de destino (solo para transferencias) */}
        {tipo === 'transferencia' && (
          <>
            <Text variant="labelLarge" style={styles.label}>
              Almacén de Destino *
            </Text>
            <Button
              mode="outlined"
              onPress={() => setShowUbicacionDestinoModal(true)}
              style={styles.selectButton}
            >
              {ubicacionDestino ? ubicacionDestino.nombre : 'Seleccionar Almacén'}
            </Button>
          </>
        )}

        {/* Cantidad */}
        <TextInput
          label="Cantidad *"
          value={cantidad}
          onChangeText={setCantidad}
          keyboardType="numeric"
          mode="outlined"
          style={styles.input}
        />

        {/* Motivo */}
        <TextInput
          label="Motivo"
          value={motivo}
          onChangeText={setMotivo}
          mode="outlined"
          style={styles.input}
          multiline
          numberOfLines={4}
        />

        {/* Botón de envío */}
        <Button
          mode="contained"
          onPress={handleSubmit}
          disabled={loading}
          style={styles.submitButton}
        >
          {loading ? <ActivityIndicator color="#fff" /> : 'Crear Solicitud'}
        </Button>
      </View>

      {/* Modal de selección de producto */}
      <Portal>
        <Modal
          visible={showProductModal}
          onDismiss={() => setShowProductModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <View style={styles.modalHeader}>
            <Text variant="titleMedium">Seleccionar Producto</Text>
            <IconButton icon="close" onPress={() => setShowProductModal(false)} />
          </View>
          <Divider />
          <Searchbar
            placeholder="Buscar producto..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
          />
          <ScrollView style={styles.modalList}>
            {productos.map((producto) => (
              <List.Item
                key={producto.id_producto}
                title={`${producto.productos_pos?.nombre}`}
                description={`SKU: ${producto.productos_pos?.sku} - Stock: ${producto.stock}`}
                onPress={() => {
                  setProductoSeleccionado(producto);
                  setShowProductModal(false);
                }}
                style={styles.listItem}
              />
            ))}
          </ScrollView>
        </Modal>
      </Portal>

      {/* Modal de selección de almacén de origen */}
      <Portal>
        <Modal
          visible={showUbicacionOrigenModal}
          onDismiss={() => setShowUbicacionOrigenModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <View style={styles.modalHeader}>
            <Text variant="titleMedium">Seleccionar Almacén de Origen</Text>
            <IconButton icon="close" onPress={() => setShowUbicacionOrigenModal(false)} />
          </View>
          <Divider />
          <ScrollView style={styles.modalList}>
            {ubicaciones.map((ubicacion) => (
              <List.Item
                key={ubicacion.id}
                title={ubicacion.nombre}
                onPress={() => {
                  setUbicacionOrigen(ubicacion);
                  setShowUbicacionOrigenModal(false);
                }}
                style={styles.listItem}
              />
            ))}
          </ScrollView>
        </Modal>
      </Portal>

      {/* Modal de selección de almacén de destino */}
      <Portal>
        <Modal
          visible={showUbicacionDestinoModal}
          onDismiss={() => setShowUbicacionDestinoModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <View style={styles.modalHeader}>
            <Text variant="titleMedium">Seleccionar Almacén de Destino</Text>
            <IconButton icon="close" onPress={() => setShowUbicacionDestinoModal(false)} />
          </View>
          <Divider />
          <ScrollView style={styles.modalList}>
            {ubicaciones.map((ubicacion) => (
              <List.Item
                key={ubicacion.id}
                title={ubicacion.nombre}
                onPress={() => {
                  setUbicacionDestino(ubicacion);
                  setShowUbicacionDestinoModal(false);
                }}
                style={styles.listItem}
              />
            ))}
          </ScrollView>
        </Modal>
      </Portal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  title: {
    marginBottom: 24,
    textAlign: 'center',
  },
  label: {
    marginBottom: 8,
  },
  segmented: {
    marginBottom: 24,
  },
  selectButton: {
    marginBottom: 24,
  },
  input: {
    marginBottom: 24,
  },
  submitButton: {
    marginTop: 16,
  },
  modalContainer: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 8,
    height: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  searchBar: {
    margin: 16,
  },
  modalList: {
    flex: 1,
  },
  listItem: {
    paddingHorizontal: 16,
  },
});

export default CreateSolicitudScreen;
