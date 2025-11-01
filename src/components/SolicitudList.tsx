
import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';

interface Item {
  id: string;
  name: string;
}

interface Props {
  items: Item[];
}

// ✅ CORRECTO - Ejemplo de lista con keys únicas
export const SolicitudList: React.FC<Props> = ({ items }) => {
  return (
    <ScrollView style={styles.container}>
      {items.map((item) => (
        <View key={item.id} style={styles.item}>
          <Text>{item.name}</Text>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  item: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
});
