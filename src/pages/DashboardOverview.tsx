import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LivingAppsService, extractRecordId } from '@/services/livingAppsService';
import type { Kurse } from '@/types/app';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BookOpen, Users, GraduationCap, DoorOpen, ClipboardList, TrendingUp, Euro, ArrowRight, Calendar } from 'lucide-react';
import { format, parseISO, isAfter } from 'date-fns';
import { de } from 'date-fns/locale';

interface Stats {
  dozenten: number;
  teilnehmer: number;
  raeume: number;
  kurse: number;
  anmeldungen: number;
  bezahlt: number;
  unbezahlt: number;
  umsatz: number;
  upcomingKurse: Kurse[];
  anmeldungenPerKurs: { name: string; count: number }[];
}

export default function DashboardOverview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [dozenten, teilnehmer, raeume, kurse, anmeldungen] = await Promise.all([
          LivingAppsService.getDozenten(),
          LivingAppsService.getTeilnehmer(),
          LivingAppsService.getRaeume(),
          LivingAppsService.getKurse(),
          LivingAppsService.getAnmeldungen(),
        ]);

        const today = new Date();
        const upcoming = kurse
          .filter(k => k.fields.startdatum && isAfter(parseISO(k.fields.startdatum), today))
          .sort((a, b) => (a.fields.startdatum ?? '').localeCompare(b.fields.startdatum ?? ''))
          .slice(0, 5);

        const bezahlt = anmeldungen.filter(a => a.fields.bezahlt === true).length;
        const unbezahlt = anmeldungen.length - bezahlt;

        const kursMap = new Map(kurse.map(k => [k.record_id, k]));
        const countMap = new Map<string, number>();
        anmeldungen.forEach(a => {
          const kursId = extractRecordId(a.fields.kurs);
          if (kursId) countMap.set(kursId, (countMap.get(kursId) ?? 0) + 1);
        });

        const anmeldungenPerKurs = Array.from(countMap.entries())
          .map(([id, count]) => ({
            name: kursMap.get(id)?.fields.titel ?? 'Unbekannt',
            count,
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 6);

        const umsatz = kurse.reduce((sum, k) => {
          const anzahl = countMap.get(k.record_id) ?? 0;
          return sum + anzahl * (k.fields.preis ?? 0);
        }, 0);

        setStats({
          dozenten: dozenten.length,
          teilnehmer: teilnehmer.length,
          raeume: raeume.length,
          kurse: kurse.length,
          anmeldungen: anmeldungen.length,
          bezahlt,
          unbezahlt,
          umsatz,
          upcomingKurse: upcoming,
          anmeldungenPerKurs,
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-8">
      {/* HERO */}
      <div
        className="relative rounded-2xl overflow-hidden p-8 hero-shadow"
        style={{ background: 'var(--gradient-hero)' }}
      >
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(circle at 80% 20%, oklch(1 0 0 / 0.3) 0%, transparent 50%), radial-gradient(circle at 20% 80%, oklch(0.7 0.2 290 / 0.4) 0%, transparent 40%)',
          }}
        />
        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <p
              className="text-xs font-bold uppercase tracking-widest mb-2"
              style={{ color: 'oklch(0.82 0.08 264)' }}
            >
              Kursverwaltungssystem
            </p>
            <h1
              className="text-4xl font-extrabold tracking-tight"
              style={{ color: 'oklch(1 0 0)' }}
            >
              Willkommen zurück
            </h1>
            <p className="mt-2 text-sm font-medium" style={{ color: 'oklch(0.85 0.06 264)' }}>
              Verwalten Sie Kurse, Dozenten, Teilnehmer und Anmeldungen an einem Ort.
            </p>
          </div>
          {!loading && stats && (
            <div className="flex gap-6 lg:gap-8 shrink-0">
              <div className="text-center">
                <div className="text-3xl font-extrabold" style={{ color: 'oklch(1 0 0)' }}>
                  {stats.kurse}
                </div>
                <div className="text-xs font-medium mt-0.5" style={{ color: 'oklch(0.82 0.06 264)' }}>
                  Kurse
                </div>
              </div>
              <div className="w-px" style={{ background: 'oklch(1 0 0 / 0.2)' }} />
              <div className="text-center">
                <div className="text-3xl font-extrabold" style={{ color: 'oklch(1 0 0)' }}>
                  {stats.anmeldungen}
                </div>
                <div className="text-xs font-medium mt-0.5" style={{ color: 'oklch(0.82 0.06 264)' }}>
                  Anmeldungen
                </div>
              </div>
              <div className="w-px" style={{ background: 'oklch(1 0 0 / 0.2)' }} />
              <div className="text-center">
                <div className="text-3xl font-extrabold" style={{ color: 'oklch(1 0 0)' }}>
                  {stats.umsatz.toLocaleString('de-DE', { maximumFractionDigits: 0 })} €
                </div>
                <div className="text-xs font-medium mt-0.5" style={{ color: 'oklch(0.82 0.06 264)' }}>
                  Umsatz
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { title: 'Dozenten', key: 'dozenten' as keyof Stats, icon: GraduationCap, href: '/dozenten', color: 'oklch(0.52 0.18 264)', bg: 'oklch(0.96 0.02 264)' },
          { title: 'Teilnehmer', key: 'teilnehmer' as keyof Stats, icon: Users, href: '/teilnehmer', color: 'oklch(0.50 0.18 180)', bg: 'oklch(0.95 0.02 180)' },
          { title: 'Räume', key: 'raeume' as keyof Stats, icon: DoorOpen, href: '/raeume', color: 'oklch(0.52 0.16 60)', bg: 'oklch(0.97 0.02 60)' },
          { title: 'Kurse', key: 'kurse' as keyof Stats, icon: BookOpen, href: '/kurse', color: 'oklch(0.50 0.20 285)', bg: 'oklch(0.95 0.02 285)' },
          { title: 'Anmeldungen', key: 'anmeldungen' as keyof Stats, icon: ClipboardList, href: '/anmeldungen', color: 'oklch(0.50 0.20 310)', bg: 'oklch(0.96 0.02 310)' },
        ].map(item => (
          <Link
            key={item.key}
            to={item.href}
            className="group rounded-2xl p-5 transition-smooth hover:elevated-shadow card-shadow"
            style={{ background: 'var(--card)' }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-2.5 rounded-xl" style={{ background: item.bg }}>
                <item.icon size={18} style={{ color: item.color }} />
              </div>
              <ArrowRight
                size={14}
                className="transition-smooth group-hover:translate-x-0.5"
                style={{ color: 'var(--muted-foreground)' }}
              />
            </div>
            <div className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--foreground)' }}>
              {loading ? <span className="animate-pulse">—</span> : (stats?.[item.key] as number) ?? 0}
            </div>
            <div className="text-xs font-semibold mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
              {item.title}
            </div>
          </Link>
        ))}
      </div>

      {/* CHARTS + PAYMENT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart */}
        <div className="lg:col-span-2 rounded-2xl p-6 card-shadow" style={{ background: 'var(--card)' }}>
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp size={16} style={{ color: 'var(--primary)' }} />
            <h2 className="text-base font-bold">Anmeldungen pro Kurs</h2>
          </div>
          {loading ? (
            <div className="h-48 flex items-center justify-center" style={{ color: 'var(--muted-foreground)' }}>
              Lädt...
            </div>
          ) : stats && stats.anmeldungenPerKurs.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.anmeldungenPerKurs} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.01 264)" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: 'oklch(0.52 0.03 255)', fontFamily: 'Plus Jakarta Sans' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'oklch(0.52 0.03 255)', fontFamily: 'Plus Jakarta Sans' }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ fill: 'oklch(0.94 0.02 264)' }}
                  contentStyle={{
                    borderRadius: 10,
                    border: '1px solid oklch(0.91 0.01 264)',
                    fontSize: 12,
                    fontFamily: 'Plus Jakarta Sans',
                  }}
                  formatter={(v: number) => [v, 'Anmeldungen']}
                />
                <Bar dataKey="count" fill="oklch(0.52 0.18 264)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div
              className="h-48 flex flex-col items-center justify-center gap-2"
              style={{ color: 'var(--muted-foreground)' }}
            >
              <ClipboardList size={32} style={{ opacity: 0.3 }} />
              <p className="text-sm">Noch keine Anmeldungen vorhanden</p>
            </div>
          )}
        </div>

        {/* Payment Status */}
        <div className="rounded-2xl p-6 card-shadow" style={{ background: 'var(--card)' }}>
          <div className="flex items-center gap-2 mb-6">
            <Euro size={16} style={{ color: 'var(--primary)' }} />
            <h2 className="text-base font-bold">Zahlungsstatus</h2>
          </div>
          {loading ? (
            <div className="h-32 animate-pulse rounded-xl" style={{ background: 'var(--muted)' }} />
          ) : stats ? (
            <div className="space-y-5">
              <div>
                <div className="flex justify-between text-sm font-semibold mb-2">
                  <span style={{ color: 'oklch(0.45 0.18 150)' }}>Bezahlt</span>
                  <span>{stats.bezahlt}</span>
                </div>
                <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'oklch(0.93 0.015 264)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: stats.anmeldungen > 0 ? `${(stats.bezahlt / stats.anmeldungen) * 100}%` : '0%',
                      background: 'oklch(0.55 0.18 150)',
                      transition: 'width 0.8s ease',
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm font-semibold mb-2">
                  <span style={{ color: 'oklch(0.52 0.20 30)' }}>Ausstehend</span>
                  <span>{stats.unbezahlt}</span>
                </div>
                <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'oklch(0.93 0.015 264)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: stats.anmeldungen > 0 ? `${(stats.unbezahlt / stats.anmeldungen) * 100}%` : '0%',
                      background: 'oklch(0.65 0.20 30)',
                      transition: 'width 0.8s ease',
                    }}
                  />
                </div>
              </div>
              <div className="pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--muted-foreground)' }}>
                  Gesamtumsatz (kalkuliert)
                </div>
                <div className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--primary)' }}>
                  {stats.umsatz.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* UPCOMING COURSES */}
      <div className="rounded-2xl p-6 card-shadow" style={{ background: 'var(--card)' }}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Calendar size={16} style={{ color: 'var(--primary)' }} />
            <h2 className="text-base font-bold">Bevorstehende Kurse</h2>
          </div>
          <Link
            to="/kurse"
            className="text-xs font-semibold flex items-center gap-1 transition-smooth"
            style={{ color: 'var(--primary)' }}
          >
            Alle anzeigen <ArrowRight size={12} />
          </Link>
        </div>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-14 animate-pulse rounded-xl" style={{ background: 'var(--muted)' }} />
            ))}
          </div>
        ) : stats && stats.upcomingKurse.length > 0 ? (
          <div className="space-y-2">
            {stats.upcomingKurse.map(kurs => (
              <div
                key={kurs.record_id}
                className="flex items-center gap-4 px-4 py-3 rounded-xl"
                style={{ background: 'var(--muted)' }}
              >
                <div className="p-2 rounded-lg" style={{ background: 'oklch(0.95 0.02 264)' }}>
                  <BookOpen size={14} style={{ color: 'var(--primary)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{kurs.fields.titel}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                    {kurs.fields.startdatum
                      ? format(parseISO(kurs.fields.startdatum), 'dd. MMMM yyyy', { locale: de })
                      : '—'}
                    {kurs.fields.enddatum &&
                      ` – ${format(parseISO(kurs.fields.enddatum), 'dd. MMMM yyyy', { locale: de })}`}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  {kurs.fields.preis != null && (
                    <div className="text-sm font-bold" style={{ color: 'var(--primary)' }}>
                      {kurs.fields.preis.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                    </div>
                  )}
                  {kurs.fields.max_teilnehmer != null && (
                    <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      max. {kurs.fields.max_teilnehmer} TN
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            className="flex flex-col items-center justify-center py-10 gap-2"
            style={{ color: 'var(--muted-foreground)' }}
          >
            <Calendar size={36} style={{ opacity: 0.25 }} />
            <p className="text-sm">Keine bevorstehenden Kurse</p>
          </div>
        )}
      </div>
    </div>
  );
}
