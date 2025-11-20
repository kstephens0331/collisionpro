"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Calendar,
  Clock,
  User,
  Car,
  Plus,
  X,
  Bell,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface Appointment {
  id: string;
  type: "drop_off" | "pickup" | "estimate" | "inspection";
  customerName: string;
  customerPhone: string;
  vehicleInfo: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  duration: number; // minutes
  notes?: string;
  estimateId?: string;
  status: "scheduled" | "confirmed" | "completed" | "no_show" | "cancelled";
  reminderSent: boolean;
}

interface AppointmentCalendarProps {
  shopId?: string;
}

export default function AppointmentCalendar({ shopId }: AppointmentCalendarProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showNewAppointment, setShowNewAppointment] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([
    // Demo appointments
    {
      id: "1",
      type: "drop_off",
      customerName: "John Smith",
      customerPhone: "(555) 123-4567",
      vehicleInfo: "2023 Toyota Camry",
      date: new Date().toISOString().split("T")[0],
      time: "09:00",
      duration: 30,
      status: "confirmed",
      reminderSent: true,
    },
    {
      id: "2",
      type: "pickup",
      customerName: "Sarah Johnson",
      customerPhone: "(555) 987-6543",
      vehicleInfo: "2021 Honda Accord",
      date: new Date().toISOString().split("T")[0],
      time: "14:00",
      duration: 15,
      status: "scheduled",
      reminderSent: false,
    },
  ]);

  const [newAppointment, setNewAppointment] = useState<Partial<Appointment>>({
    type: "drop_off",
    date: new Date().toISOString().split("T")[0],
    time: "09:00",
    duration: 30,
    status: "scheduled",
    reminderSent: false,
  });

  // Get days in month
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  // Get appointments for a specific date
  const getAppointmentsForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return appointments.filter((apt) => apt.date === dateStr);
  };

  // Navigate months
  const previousMonth = () => {
    setSelectedDate(
      new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1)
    );
  };

  const nextMonth = () => {
    setSelectedDate(
      new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1)
    );
  };

  // Create appointment
  const createAppointment = () => {
    if (
      !newAppointment.customerName ||
      !newAppointment.customerPhone ||
      !newAppointment.vehicleInfo
    ) {
      alert("Please fill in all required fields");
      return;
    }

    const appointment: Appointment = {
      id: Date.now().toString(),
      type: newAppointment.type || "drop_off",
      customerName: newAppointment.customerName,
      customerPhone: newAppointment.customerPhone,
      vehicleInfo: newAppointment.vehicleInfo,
      date: newAppointment.date || new Date().toISOString().split("T")[0],
      time: newAppointment.time || "09:00",
      duration: newAppointment.duration || 30,
      notes: newAppointment.notes,
      estimateId: newAppointment.estimateId,
      status: "scheduled",
      reminderSent: false,
    };

    setAppointments([...appointments, appointment]);
    setShowNewAppointment(false);
    setNewAppointment({
      type: "drop_off",
      date: new Date().toISOString().split("T")[0],
      time: "09:00",
      duration: 30,
      status: "scheduled",
      reminderSent: false,
    });

    alert("Appointment scheduled successfully!");
  };

  // Delete appointment
  const deleteAppointment = (id: string) => {
    if (confirm("Cancel this appointment?")) {
      setAppointments(appointments.filter((apt) => apt.id !== id));
    }
  };

  // Send reminder
  const sendReminder = (appointment: Appointment) => {
    alert(`Reminder sent to ${appointment.customerName} at ${appointment.customerPhone}`);
    setAppointments(
      appointments.map((apt) =>
        apt.id === appointment.id ? { ...apt, reminderSent: true } : apt
      )
    );
  };

  const days = getDaysInMonth(selectedDate);
  const monthName = selectedDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const todayAppointments = getAppointmentsForDate(new Date());

  const getTypeLabel = (type: string) => {
    const labels = {
      drop_off: "Drop-off",
      pickup: "Pickup",
      estimate: "Estimate",
      inspection: "Inspection",
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getTypeColor = (type: string) => {
    const colors = {
      drop_off: "bg-blue-100 text-blue-700 border-blue-200",
      pickup: "bg-green-100 text-green-700 border-green-200",
      estimate: "bg-purple-100 text-purple-700 border-purple-200",
      inspection: "bg-orange-100 text-orange-700 border-orange-200",
    };
    return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-700";
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Appointment Scheduling
            </span>
            <Button onClick={() => setShowNewAppointment(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Appointment
            </Button>
          </CardTitle>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Calendar */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={previousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h3 className="text-lg font-semibold">{monthName}</h3>
              <Button variant="outline" size="sm" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="text-center text-sm font-semibold text-gray-600 p-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-2">
              {days.map((day, index) => {
                if (day === null) {
                  return <div key={`empty-${index}`} className="p-2" />;
                }

                const date = new Date(
                  selectedDate.getFullYear(),
                  selectedDate.getMonth(),
                  day
                );
                const dateAppointments = getAppointmentsForDate(date);
                const isToday =
                  date.toDateString() === new Date().toDateString();

                return (
                  <div
                    key={day}
                    className={`min-h-[80px] p-2 border rounded ${
                      isToday ? "border-blue-500 bg-blue-50" : "border-gray-200"
                    }`}
                  >
                    <div className="text-sm font-semibold mb-1">{day}</div>
                    <div className="space-y-1">
                      {dateAppointments.slice(0, 2).map((apt) => (
                        <div
                          key={apt.id}
                          className={`text-xs p-1 rounded ${getTypeColor(apt.type)}`}
                        >
                          {apt.time} - {apt.customerName}
                        </div>
                      ))}
                      {dateAppointments.length > 2 && (
                        <div className="text-xs text-gray-500">
                          +{dateAppointments.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Today's Appointments */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Today's Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            {todayAppointments.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">
                No appointments today
              </p>
            ) : (
              <div className="space-y-3">
                {todayAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className={`p-3 border-2 rounded-lg ${getTypeColor(apt.type)}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-semibold">{apt.customerName}</p>
                        <p className="text-sm">{apt.vehicleInfo}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteAppointment(apt.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-3 w-3" />
                      <span>
                        {apt.time} ({apt.duration}min)
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm mt-1">
                      <User className="h-3 w-3" />
                      <span>{apt.customerPhone}</span>
                    </div>
                    {!apt.reminderSent && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-2"
                        onClick={() => sendReminder(apt)}
                      >
                        <Bell className="h-3 w-3 mr-2" />
                        Send Reminder
                      </Button>
                    )}
                    {apt.reminderSent && (
                      <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                        <Bell className="h-3 w-3" />
                        Reminder sent
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* New Appointment Modal */}
      {showNewAppointment && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <Card className="max-w-lg w-full">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>New Appointment</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNewAppointment(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type *</Label>
                  <select
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    value={newAppointment.type}
                    onChange={(e) =>
                      setNewAppointment({
                        ...newAppointment,
                        type: e.target.value as Appointment["type"],
                      })
                    }
                  >
                    <option value="drop_off">Drop-off</option>
                    <option value="pickup">Pickup</option>
                    <option value="estimate">Estimate</option>
                    <option value="inspection">Inspection</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Duration *</Label>
                  <select
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    value={newAppointment.duration}
                    onChange={(e) =>
                      setNewAppointment({
                        ...newAppointment,
                        duration: parseInt(e.target.value),
                      })
                    }
                  >
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">1 hour</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Customer Name *</Label>
                <Input
                  placeholder="John Smith"
                  value={newAppointment.customerName || ""}
                  onChange={(e) =>
                    setNewAppointment({
                      ...newAppointment,
                      customerName: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Customer Phone *</Label>
                <Input
                  placeholder="(555) 123-4567"
                  value={newAppointment.customerPhone || ""}
                  onChange={(e) =>
                    setNewAppointment({
                      ...newAppointment,
                      customerPhone: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Vehicle Info *</Label>
                <Input
                  placeholder="2023 Toyota Camry"
                  value={newAppointment.vehicleInfo || ""}
                  onChange={(e) =>
                    setNewAppointment({
                      ...newAppointment,
                      vehicleInfo: e.target.value,
                    })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Input
                    type="date"
                    value={newAppointment.date}
                    onChange={(e) =>
                      setNewAppointment({
                        ...newAppointment,
                        date: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Time *</Label>
                  <Input
                    type="time"
                    value={newAppointment.time}
                    onChange={(e) =>
                      setNewAppointment({
                        ...newAppointment,
                        time: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <textarea
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Any special instructions..."
                  rows={3}
                  value={newAppointment.notes || ""}
                  onChange={(e) =>
                    setNewAppointment({
                      ...newAppointment,
                      notes: e.target.value,
                    })
                  }
                />
              </div>

              <Button onClick={createAppointment} className="w-full">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Appointment
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
