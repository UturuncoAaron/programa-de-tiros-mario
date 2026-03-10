// ============================================================
//  src/types/fdc.ts
//  ÚNICA fuente de verdad para todos los tipos del sistema FDC.
//  Importar desde aquí — nunca redefinir localmente.
// ============================================================
import React from 'react';

export interface InputsState {
  mx: number; my: number; alt_pieza: number;
  tx: number; ty: number; alt_obj: number;
  ox: number; oy: number;
  zona: number;
  distObs: number; azObs: number; azObsUnit: string;
  tipoGranada: string;
  fecha_tiro: string;
  meteo_vel: number; meteo_dir: number;
  meteo_temp: number; meteo_pres: number;
  temp_carga: number; dif_peso: number; dif_vel: number;
  bloqueoMeteo: boolean;
  usarVariacion: boolean;
  orientacion_base: number;
  carga_seleccionada: string;
}

export interface ResState {
  azimutMils: number; azimutMag: number; distancia: number; variacion: number;
  cmd_orient: string; cmd_deriva: string; cmd_elev: string; cmd_time: string; cmd_dist: string;
  carga_rec: string; cargas_posibles: string[];
  rango_min: number; rango_max: number;
}

export interface ReglajeState {
  metodo: 'apreciacion' | 'medicion';
  dir: 'left' | 'right';
  val_dir: number;
  rango: 'add' | 'drop';
  val_rango: number;
  imp_az: number;
  imp_dist: number;
  imp_unit: 'mils' | 'deg';
}

export interface LogTiro {
  id: number;
  hora: string;
  tipo: 'SALVA' | 'REGLAJE';
  detalle: string;
  coords: string;
  snapshot: {
    tx: number; ty: number;
    ox: number; oy: number;
    usarVariacion: boolean;
    zona: number;
  };
  fullData?: {
    inputs:      InputsState;
    results:     ResState;
    impacto?:    { x: number; y: number };
    rawReglaje?: ReglajeState;
  };
}

// Evento onChange unificado — usado en todos los componentes
export type FdcChangeEvent =
  | React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  | { target: { id: string; value: string | number | boolean; type?: string; checked?: boolean } };