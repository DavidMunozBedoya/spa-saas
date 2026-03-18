"use client";

import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";

interface Appointment {
  id: string;
  staff_id: string;
  start_time: string;
  end_time: string;
  client_name: string;
  status: string;
}

interface Staff {
  id: string;
  full_name: string;
}

interface AvailabilityTimelineProps {
  staff: Staff[];
  appointments: Appointment[];
  onSelectSlot: (staffId: string, time: string) => void;
  selectedDate: string; // YYYY-MM-DD
  hasCreatePermission?: boolean;
}

export default function AvailabilityTimeline({ 
  staff, 
  appointments, 
  onSelectSlot,
  selectedDate,
  hasCreatePermission = false
}: AvailabilityTimelineProps) {
  
  // Timeline starts at 8:00 AM and ends at 8:00 PM (12 hours)
  const START_HOUR = 8;
  const END_HOUR = 20;
  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

  const getPosition = (timeStr: string) => {
    const date = new Date(timeStr);
    const hour = date.getHours();
    const minutes = date.getMinutes();
    
    if (hour < START_HOUR || hour >= END_HOUR) return null;
    
    const relativeHour = hour - START_HOUR;
    return (relativeHour * 60 + minutes) / 60; // Returns position in "hours"
  };

  const getDuration = (startStr: string, endStr: string) => {
    const start = new Date(startStr);
    const end = new Date(endStr);
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60); // Duration in hours
  };

  return (
    <div className="glass rounded-[2rem] border border-foreground/10 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="p-4 border-b border-foreground/5 bg-foreground/5 flex items-center justify-between">
         <div className="flex items-center gap-2">
            <Clock className="text-primary w-4 h-4" />
            <h3 className="text-[10px] font-black text-foreground uppercase tracking-[0.2em]">Disponibilidad del Staff</h3>
         </div>
         <span className="text-[10px] font-bold text-muted-foreground-auto uppercase tracking-widest bg-foreground/5 px-3 py-1 rounded-full border border-foreground/5">
            {new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
         </span>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <div className="min-w-[800px] p-6">
          
          {/* Timeline Header (Hours) */}
          <div className="flex mb-6">
            <div className="w-32 shrink-0" /> {/* Spacer for staff names */}
            <div className="flex-1 flex justify-between relative px-4">
              {hours.map((h) => (
                <div key={h} className="text-[10px] font-black text-foreground/20 uppercase tracking-tighter w-10 text-center relative">
                   <span className="relative z-10 bg-background px-1">
                    {h > 12 ? `${h-12}PM` : h === 12 ? '12PM' : `${h}AM`}
                   </span>
                   {/* Vertical guideline */}
                   <div className="absolute top-4 left-1/2 -translate-x-1/2 w-px h-[250px] bg-foreground/5 pointer-events-none" />
                </div>
              ))}
            </div>
          </div>

          {/* Staff Rows */}
          <div className="space-y-4">
            {staff.map((member) => (
              <div key={member.id} className="flex items-center group/row">
                <div className="w-32 shrink-0 flex items-center gap-2 pr-4">
                   <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-[10px] font-black group-hover/row:bg-primary group-hover/row:text-primary-foreground transition-all">
                      {member.full_name.charAt(0)}
                   </div>
                   <span className="text-[10px] font-bold text-foreground/50 group-hover/row:text-foreground truncate transition-colors uppercase tracking-tight">
                    {member.full_name.split(' ')[0]}
                   </span>
                </div>

                <div className={cn(
                  "flex-1 h-12 bg-foreground/5 rounded-2xl relative border border-foreground/5 group-hover/row:border-foreground/10 transition-all overflow-hidden",
                  !hasCreatePermission && "cursor-default"
                )}>
                   {/* Background Clickable Area (to select free slots) */}
                   {hasCreatePermission && (
                     <div 
                      className="absolute inset-0 z-0 cursor-crosshair"
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        const hourPos = (x / rect.width) * (END_HOUR - START_HOUR);
                        
                        const selectedHour = Math.floor(START_HOUR + hourPos);
                        // Snap to 30 mins
                        const mins = hourPos % 1 >= 0.5 ? 30 : 0;
                        
                        const d = new Date(selectedDate);
                        d.setHours(selectedHour, mins, 0, 0);
                        
                        // Format to YYYY-MM-DDTHH:mm for input datetime-local
                        const formatted = d.toLocaleString('sv-SE').slice(0, 16).replace(' ', 'T');
                        onSelectSlot(member.id, formatted);
                      }}
                     />
                   )}

                   {/* Appointments Blocks */}
                   {appointments
                     .filter(apt => apt.staff_id === member.id && apt.status !== 'CANCELLED')
                     .map(apt => {
                        const pos = getPosition(apt.start_time);
                        const dur = getDuration(apt.start_time, apt.end_time);
                        
                        if (pos === null) return null;

                        return (
                          <div 
                            key={apt.id}
                            className={cn(
                                "absolute top-1 bottom-1 rounded-xl px-2 flex flex-col justify-center border shadow-lg animate-in zoom-in-95 duration-300",
                                apt.status === 'COMPLETED' 
                                    ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" 
                                    : "bg-primary/20 border-primary/30 text-primary"
                            )}
                            style={{ 
                              left: `${(pos / (END_HOUR - START_HOUR)) * 100}%`,
                              width: `${(dur / (END_HOUR - START_HOUR)) * 100}%`
                            }}
                          >
                            <span className="text-[9px] font-black uppercase truncate leading-none">
                                {apt.client_name}
                            </span>
                          </div>
                        );
                     })
                   }
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
      
      <div className="px-6 py-3 bg-foreground/[0.02] border-t border-foreground/5 flex items-center justify-center gap-6">
          <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-primary" />
             <span className="text-[9px] font-black text-muted-foreground-auto uppercase tracking-widest">Ocupado / Pendiente</span>
          </div>
          <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-emerald-500" />
             <span className="text-[9px] font-black text-muted-foreground-auto uppercase tracking-widest">Completado</span>
          </div>
          {hasCreatePermission && (
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full border border-dashed border-foreground/20" />
               <span className="text-[9px] font-black text-muted-foreground-auto uppercase tracking-widest">Click zona vacía para agendar</span>
            </div>
          )}
      </div>
    </div>
  );
}
