import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, Linking } from 'react-native';
import {
  ActivityIndicator,
  Card,
  List,
  Searchbar,
  Text,
  Divider,
  Chip,
  Button,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { manualesService, ManualFile, ManualFolder } from '../services/manuales.service';
import dayjs from 'dayjs';

type FilesByFolder = Record<string, { loading: boolean; items: ManualFile[] }>; 

const isImageFile = (file: ManualFile) => {
  const name = file.name.toLowerCase();
  return name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png') || name.endsWith('.gif');
};

const isPdfFile = (file: ManualFile) => file.name.toLowerCase().endsWith('.pdf');

const ManualesScreen = () => {
  const [folders, setFolders] = useState<ManualFolder[]>([]);
  const [search, setSearch] = useState('');
  const [filesByFolder, setFilesByFolder] = useState<FilesByFolder>({});
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [expandedFolder, setExpandedFolder] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadFolders = useCallback(async () => {
    try {
      setLoadingFolders(true);
      const data = await manualesService.listFolders();
      setFolders(data);
    } catch (err: any) {
      console.error('Error loading manual folders', err);
      setError(err.message ?? 'No se pudieron obtener los manuales.');
    } finally {
      setLoadingFolders(false);
    }
  }, []);

  const loadFilesForFolder = useCallback(async (folderName: string) => {
    setFilesByFolder((prev) => ({
      ...prev,
      [folderName]: {
        loading: true,
        items: prev[folderName]?.items ?? [],
      },
    }));

    try {
      const items = await manualesService.listFiles(folderName);
      setFilesByFolder((prev) => ({
        ...prev,
        [folderName]: {
          loading: false,
          items,
        },
      }));
    } catch (err: any) {
      console.error('Error loading manual files', err);
      setFilesByFolder((prev) => ({
        ...prev,
        [folderName]: {
          loading: false,
          items: prev[folderName]?.items ?? [],
        },
      }));
      setError(err.message ?? 'No se pudieron cargar los archivos del manual seleccionado.');
    }
  }, []);

  useEffect(() => {
    loadFolders();
  }, [loadFolders]);

  const filteredFolders = useMemo(() => {
    if (!search.trim()) return folders;
    const query = search.toLowerCase();
    return folders.filter((folder) => folder.name.toLowerCase().includes(query));
  }, [folders, search]);

  const handleToggleFolder = (folderName: string) => {
    const isExpanded = expandedFolder === folderName;
    if (isExpanded) {
      setExpandedFolder(null);
      return;
    }

    setExpandedFolder(folderName);
    if (!filesByFolder[folderName]?.items?.length) {
      loadFilesForFolder(folderName);
    }
  };

  const handleOpenFile = async (file: ManualFile) => {
    try {
      const url = await manualesService.getPublicUrl(file.path);
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        setError('No se pudo abrir el archivo en este dispositivo.');
        return;
      }
      await Linking.openURL(url);
    } catch (err: any) {
      console.error('Error opening manual file', err);
      setError(err.message ?? 'No se pudo abrir el archivo seleccionado.');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <MaterialCommunityIcons name="book-open-page-variant" size={44} color="#6200ee" />
          <Text variant="headlineSmall" style={styles.headerTitle}>
            Manuales
          </Text>
          <Text variant="bodyMedium" style={styles.headerSubtitle}>
            Consulta los manuales de equipos y areas cargados desde el ERP.
          </Text>
        </View>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Buscar manuales
            </Text>
            <Searchbar
              placeholder="Buscar por ID o nombre del equipo/area"
              value={search}
              onChangeText={setSearch}
              style={styles.searchbar}
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {loadingFolders ? (
              <ActivityIndicator animating style={styles.loadingIndicator} />
            ) : filteredFolders.length === 0 ? (
              <Text style={styles.emptyState}>No se encontraron carpetas con ese criterio.</Text>
            ) : (
              <List.Section>
                {filteredFolders.map((folder) => {
                  const folderState = filesByFolder[folder.name];
                  const isExpanded = expandedFolder === folder.name;
                  return (
                    <List.Accordion
                      key={folder.name}
                      title={folder.name}
                      description={folder.updated_at ? `Actualizado ${dayjs(folder.updated_at).format('DD/MM/YYYY')}` : undefined}
                      expanded={isExpanded}
                      onPress={() => handleToggleFolder(folder.name)}
                      left={(props) => <List.Icon {...props} icon="folder" />}
                    >
                      <Divider style={styles.divider} />
                      {folderState?.loading ? (
                        <ActivityIndicator animating style={styles.loadingIndicator} />
                      ) : folderState?.items && folderState.items.length > 0 ? (
                        folderState.items.map((file) => (
                          <List.Item
                            key={file.path}
                            title={file.name}
                            description={file.updated_at ? `Actualizado ${dayjs(file.updated_at).format('DD/MM/YYYY')}` : undefined}
                            onPress={() => handleOpenFile(file)}
                            left={(props) => (
                              <List.Icon
                                {...props}
                                icon={isPdfFile(file) ? 'file-pdf-box' : isImageFile(file) ? 'image' : 'file-document'}
                                color={isPdfFile(file) ? '#d32f2f' : '#6200ee'}
                              />
                            )}
                            right={() => (
                              <Chip compact icon="arrow-top-right">
                                Abrir
                              </Chip>
                            )}
                          />
                        ))
                      ) : (
                        <Text style={styles.emptyState}>No hay archivos disponibles para este objeto.</Text>
                      )}
                    </List.Accordion>
                  );
                })}
              </List.Section>
            )}
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Consejos
            </Text>
            <Text variant="bodyMedium" style={styles.helperText}>
              Los manuales son administrados desde el ERP. Si no encuentras el documento que
              necesitas, contacta al equipo responsable para cargarlo en la carpeta correcta dentro
              del bucket ERP/Manuales.
            </Text>
            <Button
              mode="outlined"
              icon="refresh"
              onPress={loadFolders}
              style={styles.reloadButton}
            >
              Actualizar manuales
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
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
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontWeight: 'bold',
    marginTop: 8,
  },
  headerSubtitle: {
    textAlign: 'center',
    color: '#666',
    marginTop: 4,
  },
  card: {
    marginBottom: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 12,
  },
  searchbar: {
    marginBottom: 12,
  },
  loadingIndicator: {
    marginVertical: 16,
  },
  emptyState: {
    textAlign: 'center',
    color: '#777',
    paddingVertical: 16,
  },
  errorText: {
    color: '#d32f2f',
    marginBottom: 12,
  },
  divider: {
    marginVertical: 8,
  },
  helperText: {
    color: '#666',
    marginBottom: 12,
  },
  reloadButton: {
    alignSelf: 'flex-start',
  },
});

export default ManualesScreen;
