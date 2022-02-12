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
  chartOption$: Observable<EChartsOption>;

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

    const readouts$ = db
      .list<ReadoutI>('readouts', ref =>
        // ref.orderByChild('timestamp').limitToLast(1000),
        ref.orderByChild('timestamp'),
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
      );

    type reading = 'temperature' | 'humidity' | 'pressure' | 'gas';
    const getReadingByType = (type: reading, readout: ReadoutI) => {
      const { bme } = readout;
      if (!bme) {
        throw new Error('It seems like we should never see this');
      }
      return bme[type];
    };

    const selectedSensor = 'temperature'; // Could be dynamic
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
          name: selectedSensor,
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
              const reading = getReadingByType(selectedSensor, readout);
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

  ngOnInit(): void {}

  moduleClick = (moduleId: string) =>
    this.router.navigate(['modules', moduleId]);
}
