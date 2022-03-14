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

const baseChatOption: EChartsOption = {
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
  // Duplicationg these for ngModel is probably superfluous
  // Comes from incremental evolution of the code
  selectedSensor: SensorT = 'humidity';
  selectedSensor$ = new BehaviorSubject<SensorT>(this.selectedSensor);
  selectedQueryDepth: QueryTimeDepthT = 'week';
  selectedQueryDepth$ = new BehaviorSubject<QueryTimeDepthT>(
    this.selectedQueryDepth,
  );
  modules$: Observable<ModuleI[]>;
  readings$ = new Subject<ReadoutI[]>();
  chartOption$: Observable<EChartsOption>;
  chartOption: EChartsOption = baseChatOption;
  updateOption: EChartsOption;

  shouldSync = true; // Could be dynamic

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
    this.initializeChart();
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
    this.readingsSubscription?.unsubscribe();
    this.readingsSubscription = this.db
      .list<ReadoutI>('readouts', ref =>
        ref
          .orderByChild('timestamp')
          .startAt(this.getQueryDate(this.selectedQueryDepth).getTime()),
      )
      .snapshotChanges()
      .pipe(
        takeUntil(this.unsubscribe$),
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

  onSensorChange = () => {
    this.selectedSensor$.next(this.selectedSensor);
  };

  onQueryDepthChange = () => {
    this.selectedQueryDepth$.next(this.selectedQueryDepth);
  };

  lastQueryDepth = '';
  initializeChart = () => {
    this.updateSensorQuery();
    combineLatest([
      this.modules$,
      this.readings$,
      this.selectedSensor$,
      this.selectedQueryDepth$,
    ])
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(([modules, readings, selectedSensor, selectedQueryDepth]) => {
        if (this.lastQueryDepth !== selectedQueryDepth) {
          this.updateSensorQuery();
          this.lastQueryDepth = selectedQueryDepth;
        }

        const readoutsByModule: Record<string, ReadoutI[]> = readings.reduce(
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
          name: selectedSensor,
          // Should probably be indoor-only option because outside can freeze
          min: 12,
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
              const reading = this.getReadingByType(selectedSensor, readout);
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
          legend,
          series,
        };

        this.updateOption = option;
      });
  };

  moduleClick = (moduleId: string) =>
    this.router.navigate(['modules', moduleId]);
}
