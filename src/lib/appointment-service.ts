/**
 * Appointment Scheduling Service
 *
 * Customer appointment management with automated reminders
 */

import { createClient } from '@supabase/supabase-js';
import { sendMessage } from './messaging-service';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export type AppointmentStatus = 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';

export interface CreateAppointmentOptions {
  customerId: string;
  shopId: string;
  estimateId?: string;
  title: string;
  description?: string;
  appointmentType: string;
  scheduledStart: Date;
  scheduledEnd: Date;
  timezone?: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleYear?: number;
  notes?: string;
  sendConfirmation?: boolean;
}

/**
 * Create a new appointment
 */
export async function createAppointment(options: CreateAppointmentOptions): Promise<{
  success: boolean;
  appointmentId?: string;
  error?: string;
}> {
  try {
    const { data: appointment, error } = await supabase
      .from('Appointment')
      .insert({
        customerId: options.customerId,
        shopId: options.shopId,
        estimateId: options.estimateId,
        title: options.title,
        description: options.description,
        appointmentType: options.appointmentType,
        scheduledStart: options.scheduledStart.toISOString(),
        scheduledEnd: options.scheduledEnd.toISOString(),
        duration: Math.round((options.scheduledEnd.getTime() - options.scheduledStart.getTime()) / 60000),
        timezone: options.timezone || 'America/New_York',
        status: 'scheduled',
        customerName: options.customerName,
        customerEmail: options.customerEmail,
        customerPhone: options.customerPhone,
        vehicleMake: options.vehicleMake,
        vehicleModel: options.vehicleModel,
        vehicleYear: options.vehicleYear,
        notes: options.notes,
      })
      .select()
      .single();

    if (error) throw error;

    // Send confirmation message
    if (options.sendConfirmation && options.customerPhone) {
      const appointmentDate = options.scheduledStart.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
      const appointmentTime = options.scheduledStart.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });

      await sendMessage({
        customerId: options.customerId,
        shopId: options.shopId,
        type: 'sms',
        body: `Your appointment is confirmed for ${appointmentDate} at ${appointmentTime}. We look forward to seeing you!`,
        recipientPhone: options.customerPhone,
        appointmentId: appointment.id,
      });
    }

    // Schedule reminder for 24 hours before
    await scheduleAppointmentReminder(appointment.id, options.scheduledStart);

    return {
      success: true,
      appointmentId: appointment.id,
    };
  } catch (error: any) {
    console.error('Create appointment error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Schedule automated reminder
 */
async function scheduleAppointmentReminder(appointmentId: string, scheduledStart: Date): Promise<void> {
  try {
    const reminderTime = new Date(scheduledStart);
    reminderTime.setHours(reminderTime.getHours() - 24); // 24 hours before

    // Only schedule if in the future
    if (reminderTime > new Date()) {
      await supabase.from('AutomatedReminder').insert({
        type: 'appointment',
        appointmentId,
        scheduledFor: reminderTime.toISOString(),
        title: 'Appointment Reminder',
        message: 'You have an appointment tomorrow',
        deliveryMethod: 'sms',
        status: 'pending',
      });
    }
  } catch (error) {
    console.error('Schedule reminder error:', error);
  }
}

/**
 * Get appointments for customer
 */
export async function getCustomerAppointments(customerId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('Appointment')
      .select('*')
      .eq('customerId', customerId)
      .order('scheduledStart', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error: any) {
    console.error('Get customer appointments error:', error);
    return [];
  }
}

/**
 * Get upcoming appointments for shop
 */
export async function getUpcomingAppointments(
  shopId: string,
  daysAhead: number = 7
): Promise<any[]> {
  try {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + daysAhead);

    const { data, error } = await supabase
      .from('Appointment')
      .select('*')
      .eq('shopId', shopId)
      .gte('scheduledStart', new Date().toISOString())
      .lte('scheduledStart', endDate.toISOString())
      .in('status', ['scheduled', 'confirmed'])
      .order('scheduledStart', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error: any) {
    console.error('Get upcoming appointments error:', error);
    return [];
  }
}

/**
 * Update appointment status
 */
export async function updateAppointmentStatus(
  appointmentId: string,
  status: AppointmentStatus,
  cancellationReason?: string
): Promise<boolean> {
  try {
    const updates: any = { status };

    if (status === 'cancelled' && cancellationReason) {
      updates.cancellationReason = cancellationReason;
    }

    const { error } = await supabase
      .from('Appointment')
      .update(updates)
      .eq('id', appointmentId);

    if (error) throw error;
    return true;
  } catch (error: any) {
    console.error('Update appointment status error:', error);
    return false;
  }
}

/**
 * Process pending reminders
 */
export async function processPendingReminders(): Promise<number> {
  try {
    const { data: reminders, error } = await supabase
      .from('AutomatedReminder')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduledFor', new Date().toISOString())
      .lt('retryCount', 'maxRetries');

    if (error) throw error;

    let processed = 0;

    for (const reminder of reminders || []) {
      try {
        // Get appointment details if applicable
        let recipientPhone: string | undefined;
        let recipientEmail: string | undefined;

        if (reminder.appointmentId) {
          const { data: appointment } = await supabase
            .from('Appointment')
            .select('customerPhone, customerEmail')
            .eq('id', reminder.appointmentId)
            .single();

          if (appointment) {
            recipientPhone = appointment.customerPhone;
            recipientEmail = appointment.customerEmail;
          }
        }

        // Send reminder
        const result = await sendMessage({
          customerId: reminder.customerId,
          shopId: reminder.shopId,
          type: reminder.deliveryMethod === 'email' ? 'email' : 'sms',
          subject: reminder.title,
          body: reminder.message,
          recipientPhone: recipientPhone || reminder.recipientPhone,
          recipientEmail: recipientEmail || reminder.recipientEmail,
          appointmentId: reminder.appointmentId,
          estimateId: reminder.estimateId,
        });

        // Update reminder status
        if (result.success) {
          await supabase
            .from('AutomatedReminder')
            .update({
              status: 'sent',
              sentAt: new Date().toISOString(),
            })
            .eq('id', reminder.id);

          processed++;
        } else {
          await supabase
            .from('AutomatedReminder')
            .update({
              retryCount: reminder.retryCount + 1,
              errorMessage: result.error,
              failedAt: new Date().toISOString(),
            })
            .eq('id', reminder.id);
        }
      } catch (error) {
        console.error(`Error processing reminder ${reminder.id}:`, error);
      }
    }

    return processed;
  } catch (error: any) {
    console.error('Process pending reminders error:', error);
    return 0;
  }
}
