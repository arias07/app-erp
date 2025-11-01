import { OrdenMtto } from '../types/order.types';
import { Usuario } from '../types/user.types';
import { BitacoraConcepto, BitacoraMedicionEntrada, BitacoraSerieDato } from '../types/bitacora.types';
import * as Notifications from 'expo-notifications';

export interface PushTarget {
  userId: string;
  expoPushToken?: string | null;
}

const logNotification = (title: string, payload: Record<string, any>) => {
  console.log('[notificationService]', title, payload);
};

// Función auxiliar para enviar notificación local
const sendLocalNotification = async (title: string, body: string, data?: any) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: true,
      },
      trigger: null, // Inmediato
    });
    console.log('[notificationService] Local notification sent:', title);
  } catch (error) {
    console.error('[notificationService] Error sending local notification:', error);
  }
};

export const notificationService = {
  // Cuando se crea una orden correctiva, notificar a todos los ejecutores
  async sendOrderCreatedNotification(
    order: OrdenMtto,
    executors: Usuario[]
  ): Promise<void> {
    logNotification('orderCreated', {
      orderId: order.id,
      tipo: order.tipo,
      executors: executors.map((executor) => executor.id),
    });

    // Si es correctiva, enviar notificación a ejecutores
    if (order.tipo === 'correctiva') {
      await sendLocalNotification(
        'Nueva Orden Correctiva',
        `Se ha generado una nueva orden correctiva: ${order.titulo}`,
        { orderId: order.id, tipo: 'order_created' }
      );
    }
  },

  // Cuando se asigna un ejecutor, notificar al solicitante
  async sendOrderAssignedNotification(order: OrdenMtto, executor: Usuario): Promise<void> {
    logNotification('orderAssigned', {
      orderId: order.id,
      executorId: executor.id,
    });

    const executorName = executor.nombre_completo || 'Un ejecutor';
    await sendLocalNotification(
      'Orden Asignada',
      `El servicio requerido está siendo atendido por: ${executorName}`,
      { orderId: order.id, tipo: 'order_assigned' }
    );
  },

  // Cuando se completa una orden, notificar al solicitante
  async sendOrderCompletedNotification(order: OrdenMtto, solicitante: Usuario): Promise<void> {
    logNotification('orderCompleted', {
      orderId: order.id,
      solicitanteId: solicitante.id,
    });

    await sendLocalNotification(
      'Orden Completada',
      `El servicio requerido: "${order.titulo}", ya fue concluido. Favor de verificar.`,
      { orderId: order.id, tipo: 'order_completed' }
    );
  },

  async sendBitacoraThresholdAlert(
    concepto: BitacoraConcepto,
    entry: BitacoraMedicionEntrada,
    alerts: BitacoraSerieDato[]
  ): Promise<void> {
    logNotification('bitacoraThreshold', {
      conceptoId: concepto.id,
      conceptoNombre: concepto.nombre,
      entryId: entry.id,
      fecha: entry.fecha_medicion,
      alerts,
    });
  },
};
