import { Component, OnDestroy, OnInit } from '@angular/core';
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
import {
  BehaviorSubject,
  combineLatest,
  map,
  Observable,
  Subject,
  Subscription,
  takeUntil,
} from 'rxjs';
import { ModuleI, ReadoutI } from 'src/app/models';

// // example of recursive type can apply to differ
// export interface Task {
//   name: string;
//   completed: boolean;
//   color: ThemePalette;
//   subtasks?: Task[];
// }

type QueryTimeDepthT = 'hour' | 'day' | 'week' | 'month' | 'year' | 'all';

type SensorT = 'temperature' | 'humidity' | 'pressure' | 'gas';
// sensor options interface
export interface SensorOptions {
  name: string;
  sensor: SensorT;
}

export interface QueryDepthOptions {
  name: string;
  depth: QueryTimeDepthT;
}

export interface KeyMapI<T> {
  [key: string]: T;
}

@Component({
  selector: 'sen-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit, OnDestroy {
  private unsubscribe$ = new Subject();
  modules$: Observable<ModuleI[]>;
  readings$ = new BehaviorSubject<ReadoutI[]>([]);
  // chartOption$$ = new BehaviorSubject<EChartsOption>();
  chartOption$: Observable<EChartsOption>;
  chartOption: EChartsOption = {
    // title: {
    //   text: 'Bright House Sensor Data',
    // },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
      },
    },
    legend: {},
    xAxis: {
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
    },
    yAxis: {
      type: 'value',
      name: 'y axis',
      min: 12,
    },
    series: [],
  };
  updateOption: EChartsOption;

  shouldSync = true; // Could be dynamic

  // sensor options
  sensorOptions: SensorOptions[] = [
    {
      name: 'Temperature',
      sensor: 'temperature',
    },
    {
      name: 'Humidity',
      sensor: 'humidity',
    },
    {
      name: 'Pressure',
      sensor: 'pressure',
    },
    {
      name: 'Gas',
      sensor: 'gas',
    },
  ];

  selectedSensor: SensorT = 'humidity';

  // query depth options
  queryDepthOptions: QueryDepthOptions[] = [
    {
      name: 'Hour',
      depth: 'hour',
    },
    {
      name: 'Day',
      depth: 'day',
    },
    {
      name: 'Week',
      depth: 'week',
    },
    {
      name: 'Month',
      depth: 'month',
    },
    {
      name: 'Year',
      depth: 'year',
    },
    {
      name: 'All',
      depth: 'all',
    },
  ];

  selectedQueryDepth: QueryTimeDepthT = 'week';

  constructor(private db: AngularFireDatabase, private router: Router) {
    this.modules$ = db
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
      );
    this.updateSensorQuery();
    this.updateSensorSelection();

    this.chartOption$
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(chartOption => {
        if (!this.chartOption) {
          this.chartOption = chartOption;
        }
        this.updateOption = chartOption;
      });
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
  }
  getQueryDate = (timeDepth: QueryTimeDepthT) => {
    const date = new Date();
    switch (timeDepth) {
      case 'hour':
        date.setHours(date.getHours() - 1);
        break;
      case 'day':
        date.setDate(date.getDate() - 1);
        break;
      case 'week':
        date.setDate(date.getDate() - 7);
        break;
      case 'month':
        date.setMonth(date.getMonth() - 1);
        break;
      case 'year':
        date.setFullYear(date.getFullYear() - 1);
        break;
      case 'all':
        date.setFullYear(date.getFullYear() - 100);
        break;
      default:
        date.setFullYear(date.getFullYear() - 1);
    }
    return date;
  };

  getReadingByType = (type: SensorT, readout: ReadoutI) => {
    const { bme } = readout;
    if (!bme) {
      throw new Error('It seems like we should never see this');
    }
    return bme[type];
  };

  readingsSubscription: Subscription;
  updateSensorQuery = () => {
    console.log(this.selectedQueryDepth);
    this.readingsSubscription = this.db
      .list<ReadoutI>('readouts', ref =>
        ref
          .orderByChild('timestamp')
          .startAt(this.getQueryDate(this.selectedQueryDepth).getTime()),
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
      )
      .subscribe(readouts => this.readings$.next(readouts));
  };

  // rename
  updateSensorSelection = () => {
    const chartOption$ = combineLatest([this.modules$, this.readings$]).pipe(
      map(([modules, readings]) => {
        const readoutsByModule: KeyMapI<ReadoutI[]> = readings.reduce(
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
          const nextSeries: SeriesOption = {
            name,
            type: 'line',
            data: readouts?.map(readout => {
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
          return nextSeries;
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

  moduleClick = (moduleId: string) =>
    this.router.navigate(['modules', moduleId]);
}
