import { Component, OnInit } from '@angular/core';
// import { Database, ref, listVal } from '@angular/fire/database';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Router } from '@angular/router';
import {
  EChartsOption,
  SeriesOption,
  XAXisComponentOption,
  YAXisComponentOption,
} from 'echarts';
import { combineLatest, map, Observable } from 'rxjs';
import { ModuleI, ReadoutI } from 'src/app/models';

const fakeData = () => {
  const data: any[] = [];
  // const length = Math.random() * 100;
  const length = 100;
  const now = new Date();
  let lastTimeIncrement = 0;
  let lastDatapoint = 50;
  for (let i = 0; i < length; i++) {
    // THIS CAUSES TOOLTIP TO SHOW ONLY ONE AT A TIME
    // lastTimeIncrement += Math.random() * 10;
    lastTimeIncrement += 5;
    lastDatapoint += Math.random() * 10 - 5;
    const nextDate = new Date(now.getTime() + lastTimeIncrement * 1000);

    data.push([nextDate, lastDatapoint]);
  }
  return data;
};

@Component({
  selector: 'sen-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  modules$: Observable<ModuleI[]>;
  chartOption$: Observable<EChartsOption>;

  // dates = fakeDates();

  tooltipTestChartOption: EChartsOption;
  chartOption: EChartsOption;

  // isOptionReady = () =>
  //   !!this.chartOption &&
  //   this.chartOption.series &&
  //   (this.chartOption.series as SeriesOption[]).length === 5;

  constructor(db: AngularFireDatabase, private router: Router) {
    const modulesNode = db.list<ModuleI>('modules');
    const modules$ = (this.modules$ = modulesNode.snapshotChanges().pipe(
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
        ref.orderByChild('timestamp').limitToLast(1000),
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
            // Could replace temp with dynamic option
            const {
              bme: { temperature },
              moduleId,
              timestamp,
            } = readout;
            return {
              key,
              moduleId,
              temperature,
              timestamp,
            };
          }),
        ),
      );

    interface KeyMapI<T> {
      [key: string]: T;
    }
    // LEGIT
    combineLatest([modules$, readouts$]).subscribe(([modules, readouts]) => {
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
      // console.log(readoutsByModule);

      const modulesWithReadouts = modules.map(module => {
        const { id } = module;
        const readouts = readoutsByModule[id!];
        return {
          ...module,
          readouts,
        };
      });

      const moduleSeries = modulesWithReadouts.map(({ name, readouts }) => {
        const series: SeriesOption = {
          name,
          type: 'line',
          data: readouts.map((readout: any) => {
            // Rounding to the nearest 5 minutes syncs up the readouts
            // This is a hacky way to get the tooltip to display all at once
            const coeff = 1000 * 60 * 5; // 5 minutes
            return [
              new Date(Math.round(readout.timestamp / coeff) * coeff),
              readout.temperature,
            ];
          }),
        };
        return series;
      });
      this.chartOption = {
        tooltip: {
          trigger: 'axis',
        },
        xAxis: {
          type: 'time',
        },
        yAxis: {
          type: 'value',
        },
        series: moduleSeries,
      };

      console.log(this.chartOption);
    });

    // end legit
    // TESTING

    const series: SeriesOption[] = [];
    for (let i = 0; i < 5; i++) {
      const next: SeriesOption = {
        name: `Series ${i}`,
        type: 'line',
        data: fakeData(),
      };
      series.push(next);
    }

    this.tooltipTestChartOption = {
      tooltip: {
        trigger: 'axis',
      },
      xAxis: {
        type: 'time',
      },
      yAxis: {
        type: 'value',
        name: 'testing',
      },
      series,
      // series: [
      //   {
      //     type: 'line',
      //     data: this.dates.map(date => [date, Math.random() * 100]),
      //     name: 't1',
      //   },
      //   {
      //     type: 'line',
      //     data: this.dates.map(date => [date, Math.random() * 100]),
      //     name: 't2',
      //   },
      // ],
      // legend: {
      //   data: ['Readout'],
      // },
    };

    console.log(this.tooltipTestChartOption);

    // end testing
    // modular
    // const modulesNode = ref(db, 'modules');
    // this.modules$ = listVal<ModuleI>(modulesNode, { keyField: 'id' });

    // const readoutsNode = db.list<ReadoutI>('readouts', ref =>
    //   ref.orderByChild('timestamp').limitToLast(50000),
    // );
    // const readouts$ = readoutsNode.snapshotChanges().pipe(
    //   map(changes =>
    //     changes.map(change => {
    //       const { key } = change.payload;
    //       const readout = change.payload.val();
    //       if (!key || !readout) {
    //         throw new Error('It seems like we should never see this');
    //       }
    //       // Could replace temp with dynamic option
    //       const {
    //         bme: { temperature },
    //         moduleId,
    //         timestamp,
    //       } = readout;
    //       return {
    //         key,
    //         moduleId,
    //         temperature,
    //         timestamp,
    //       };
    //     }),
    //   ),
    // );

    // this.chartOption$ = combineLatest([this.modules$, readouts$]).pipe(
    //   map(([modules, readouts]) => {
    //     // const xAxis: XAXisComponentOption[] = modules.map(module => ({
    //     //   type: 'category',
    //     //   data: readouts
    //     //     .filter(readout => readout.moduleId === module.id)
    //     //     .map(readout => new Date(readout.timestamp).toLocaleTimeString()),
    //     //   axisTick: {
    //     //     alignWithLabel: false,
    //     //   },
    //     // }));
    //     const xAxis: XAXisComponentOption[] = modules.map(module => ({
    //       type: 'time',
    //       axisLabel: {
    //         formatter: function (value: number) {
    //           let date = new Date(value);
    //           if (date.getHours() === 0) {
    //             return date.toLocaleDateString();
    //           }

    //           return date.toLocaleTimeString();
    //         },
    //       },
    //     }));
    //     const yAxis: YAXisComponentOption = {
    //       type: 'value',
    //       name: 'Temperature',
    //     };
    //     const selectedSeries: SeriesOption[] = modules.map(module => {
    //       const moduleReadouts = readouts.filter(
    //         readout => readout.moduleId === module.id,
    //       );
    //       // const tempAndTimestamp = moduleReadouts.map(
    //       //   readout => readout.temperature,
    //       // );
    //       const tempAndTimestamp = moduleReadouts.map(readout => [
    //         readout.timestamp,
    //         readout.temperature,
    //       ]);
    //       const series: SeriesOption = {
    //         type: 'line',
    //         data: tempAndTimestamp,
    //         name: module.name,
    //       };
    //       return series;
    //     });

    //     const chartOption: EChartsOption = {
    //       tooltip: {
    //         trigger: 'item',
    //         axisPointer: {
    //           type: 'line',
    //           axis: 'x',
    //         },
    //         displayMode: 'single',
    //       },
    //       yAxis,
    //       xAxis,
    //       series: selectedSeries,
    //     };
    //     return chartOption;
    //   }),
    // );
  }

  ngOnInit(): void {}

  moduleClick = (moduleId: string) =>
    this.router.navigate(['modules', moduleId]);
}
