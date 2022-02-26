import { Component, OnInit } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Router } from '@angular/router';
import {
  EChartsOption,
  SeriesOption,
  XAXisComponentOption,
  YAXisComponentOption,
  TooltipComponentOption,
  LegendComponentOption,
} from 'echarts';
import { combineLatest, map, Observable } from 'rxjs';
import { ModuleI, ReadoutI } from 'src/app/models';

// from AngularMaterial checkbox example
import { ThemePalette } from '@angular/material/core';

// example of recursive type can apply to differ
export interface Task {
  name: string;
  completed: boolean;
  color: ThemePalette;
  subtasks?: Task[];
}

type SensorT = 'temperature' | 'humidity' | 'pressure' | 'gas';
// sensor options interface
export interface SensorOptions {
  name: string;
  sensor: SensorT;
  color: ThemePalette;
  selected: boolean;
}

export interface KeyMapI<T> {
  [key: string]: T;
}

@Component({
  selector: 'sen-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  modules$: Observable<ModuleI[]>;
  readouts$: Observable<ReadoutI[]>;
  chartOption$: Observable<EChartsOption>;

  shouldSync = true; // Could be dynamic

  // sensor options
  sensors: SensorOptions[] = [
    {
      name: 'Temperature',
      sensor: 'temperature',
      color: 'primary',
      selected: true,
    },
    {
      name: 'Humidity',
      sensor: 'humidity',
      color: 'accent',
      selected: true,
    },
    {
      name: 'Pressure',
      sensor: 'pressure',
      color: 'warn',
      selected: true,
    },
    {
      name: 'Gas',
      sensor: 'gas',
      color: 'primary',
      selected: true,
    },
  ];

  selectedSensor: SensorT = 'humidity';

  constructor(db: AngularFireDatabase, private router: Router) {
    const modules$ = (this.modules$ = db
      .list<ModuleI>('modules')
      .snapshotChanges()
      .pipe(
        map(changes =>
          changes.map(
            change =>
              ({
                id: change.payload.key,
                ...change.payload.val(),
              } as ModuleI),
          ),
        ),
      ));

    //date of yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    // date of 1 week ago
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    // date of 1 month ago
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const yearAgo = new Date();
    yearAgo.setFullYear(yearAgo.getFullYear() - 1);

    const beginningOfTime = new Date(0);

    const readouts$ = (this.readouts$ = db
      .list<ReadoutI>('readouts', ref =>
        ref.orderByChild('timestamp').startAt(weekAgo.getTime()),
      )
      .snapshotChanges()
      .pipe(
        map(changes =>
          changes.map(change => {
            const { key } = change.payload;
            const readout = change.payload.val();
            if (!key || !readout) {
              throw new Error('It seems like we should never see this');
            }
            return {
              key,
              ...readout,
            };
          }),
        ),
      ));

    const getReadingByType = (type: SensorT, readout: ReadoutI) => {
      const { bme } = readout;
      if (!bme) {
        throw new Error('It seems like we should never see this');
      }
      return bme[type];
    };

    const shouldSync = true; // Could be dynamic
    const chartOption$ = combineLatest([modules$, readouts$]).pipe(
      map(([modules, readouts]) => {
        const readoutsByModule: KeyMapI<ReadoutI[]> = readouts.reduce(
          (acc, readout) => {
            const { moduleId } = readout;
            if (!acc[moduleId]) {
              acc[moduleId] = [];
            }
            acc[moduleId].push(readout);
            return acc;
          },
          {},
        );
        // const xAxis: XAXisComponentOption[] = [];
        // const yAxis: YAXisComponentOption[] = [];
        const xAxis: XAXisComponentOption = {
          type: 'time',
          axisLabel: {
            formatter: function (value: number) {
              let date = new Date(value);
              if (date.getHours() === 0) {
                return date.toLocaleDateString();
              }

              return date.toLocaleTimeString();
            },
          },
        };
        const yAxis: YAXisComponentOption = {
          type: 'value',
          name: this.selectedSensor,
          // Should probably be indoor-only option because outside can freeze
          min: 12,
        };
        const tooltip: TooltipComponentOption = {
          trigger: 'axis',
          axisPointer: {
            type: 'cross',
          },
        };
        const legend: LegendComponentOption = {
          data: modules.map(({ name }) => name),
        };
        const series: SeriesOption[] = modules.map(module => {
          const { name, id } = module;
          if (!id) {
            throw new Error(
              'No module id. It seems like we should never see this',
            );
          }
          const readouts = readoutsByModule[id];
          const series: SeriesOption = {
            name,
            type: 'line',
            data: readouts.map(readout => {
              // Rounding to the nearest 5 minutes syncs up the readouts
              // This is a hacky way to get the tooltip to display all at once
              const coeff = 1000 * 60 * 5; // 5 minutes
              const reading = getReadingByType(this.selectedSensor, readout);
              const date = shouldSync
                ? new Date(Math.round(readout.timestamp / coeff) * coeff)
                : new Date(readout.timestamp);
              return [date, reading];
            }),
          };
          return series;
        });
        const option: EChartsOption = {
          xAxis,
          yAxis,
          series,
          tooltip,
          legend,
          toolbox: {
            right: 20,
            feature: {
              dataZoom: {
                yAxisIndex: 'none',
              },
              saveAsImage: {},
              restore: {},
              magicType: {},
            },
          },
          dataZoom: [
            {
              startValue: new Date().setHours(0),
            },
            { type: 'inside' },
          ],
        };
        return option;
      }),
    );
    this.chartOption$ = chartOption$;
  }

  getReadingByType = (type: SensorT, readout: ReadoutI) => {
    const { bme } = readout;
    if (!bme) {
      throw new Error('It seems like we should never see this');
    }
    return bme[type];
  };

  // rename
  updateSensorSelection = () => {
    console.log('updateSensorSelection');
    console.log(this.sensors);
    const chartOption$ = combineLatest([this.modules$, this.readouts$]).pipe(
      map(([modules, readouts]) => {
        const readoutsByModule: KeyMapI<ReadoutI[]> = readouts.reduce(
          (acc, readout) => {
            const { moduleId } = readout;
            if (!acc[moduleId]) {
              acc[moduleId] = [];
            }
            acc[moduleId].push(readout);
            return acc;
          },
          {},
        );
        // const xAxis: XAXisComponentOption[] = [];
        // const yAxis: YAXisComponentOption[] = [];
        const xAxis: XAXisComponentOption = {
          type: 'time',
          axisLabel: {
            formatter: function (value: number) {
              let date = new Date(value);
              if (date.getHours() === 0) {
                return date.toLocaleDateString();
              }

              return date.toLocaleTimeString();
            },
          },
        };
        const yAxis: YAXisComponentOption = {
          type: 'value',
          name: this.selectedSensor,
          // Should probably be indoor-only option because outside can freeze
          min: 12,
        };
        const tooltip: TooltipComponentOption = {
          trigger: 'axis',
          axisPointer: {
            type: 'cross',
          },
        };
        const legend: LegendComponentOption = {
          data: modules.map(({ name }) => name),
        };
        const series: SeriesOption[] = modules.map(module => {
          const { name, id } = module;
          if (!id) {
            throw new Error(
              'No module id. It seems like we should never see this',
            );
          }
          const readouts = readoutsByModule[id];
          const series: SeriesOption = {
            name,
            type: 'line',
            data: readouts.map(readout => {
              // Rounding to the nearest 5 minutes syncs up the readouts
              // This is a hacky way to get the tooltip to display all at once
              const coeff = 1000 * 60 * 5; // 5 minutes
              const reading = this.getReadingByType(
                this.selectedSensor,
                readout,
              );
              const date = this.shouldSync
                ? new Date(Math.round(readout.timestamp / coeff) * coeff)
                : new Date(readout.timestamp);
              return [date, reading];
            }),
          };
          return series;
        });
        const option: EChartsOption = {
          xAxis,
          yAxis,
          series,
          tooltip,
          legend,
          toolbox: {
            right: 20,
            feature: {
              dataZoom: {
                yAxisIndex: 'none',
              },
              saveAsImage: {},
              restore: {},
              magicType: {},
            },
          },
          dataZoom: [
            {
              startValue: new Date().setHours(0),
            },
            { type: 'inside' },
          ],
        };
        return option;
      }),
    );
    this.chartOption$ = chartOption$;
  };

  ngOnInit(): void {}

  moduleClick = (moduleId: string) =>
    this.router.navigate(['modules', moduleId]);
}
