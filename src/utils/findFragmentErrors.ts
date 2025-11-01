
/**
 * Guía para corregir errores comunes de React
 */

export const fragmentErrorFixes = {
  // Error 1: Fragment con props de estilo
  incorrect1: `
    <> 
      <View style={styles.container}>
        <Text>Contenido</Text>
      </View>
    </>
  `,
  correct1: `
    <View style={styles.container}>
      <Text>Contenido</Text>
    </View>
  `,

  // Error 2: Lista sin keys
  incorrect2: `
    {items.map((item) => (
      <View>
        <Text>{item.name}</Text>
      </View>
    ))}
  `,
  correct2: `
    {items.map((item) => (
      <View key={item.id}>
        <Text>{item.name}</Text>
      </View>
    ))}
  `,

  // Error 3: Fragment con style
  incorrect3: `
    <React.Fragment style={styles.wrapper}>
      <Text>Texto</Text>
    </React.Fragment>
  `,
  correct3: `
    <View style={styles.wrapper}>
      <Text>Texto</Text>
    </View>
  `,
};
