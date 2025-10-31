import { OrdenMtto } from '../types/order.types';
import { Usuario } from '../types/user.types';
import { BitacoraConcepto, BitacoraMedicionEntrada, BitacoraSerieDato } from '../types/bitacora.types';

export interface PushTarget {
  userId: string;
  expoPushToken?: string | null;
}

const logNotification = (title: string, payload: Record<string, any>) => {
  console.log('[notificationService]', title, payload);
};

export const notificationService = {
  async sendOrderCreatedNotification(
    order: OrdenMtto,
    executors: Usuario[]
  ): Promise<void> {
    logNotification('orderCreated', {
      orderId: order.id,
      tipo: order.tipo,
      executors: executors.map((executor) => executor.id),
    });
  },

  async sendOrderAssignedNotification(order: OrdenMtto, executor: Usuario): Promise<void> {
    logNotification('orderAssigned', {
      orderId: order.id,
      executorId: executor.id,
    });
  },

  async sendOrderCompletedNotification(order: OrdenMtto, solicitante: Usuario): Promise<void> {
    logNotification('orderCompleted', {
      orderId: order.id,
      solicitanteId: solicitante.id,
    });
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
