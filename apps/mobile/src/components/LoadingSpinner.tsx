import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { Text } from 'react-native-paper'

interface LoadingSpinnerProps {
  message?: string
}

export function LoadingSpinner({ message = 'Carregando...' }: LoadingSpinnerProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#F97316" />
      <Text style={styles.message}>{message}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  message: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 8,
  },
})

