import { Component } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { ActivatedRoute } from '@angular/router';
import { EChartsOption, SeriesOption, LineSeriesOption } from 'echarts';
import { filter, map, Subject, takeUntil } from 'rxjs';
import { ModuleI, ReadoutI } from 'src/app/models';

const baseChatOption: EChartsOption = {
  title: {
    text: 'Room Loading',
    left: 'center',
    top: 20,
  },
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
  yAxis: [
    {
      type: 'value',
      name: 'humidity',
      min: 25,
    },
    {
      type: 'value',
      name: 'temperature',
      inverse: true,
      position: 'left',
    },
    // {
    //   type: 'value',
    //   name: 'pressure',
    // },
    {
      type: 'value',
      name: 'gas',
      position: 'right',
      // offset: 60,
    },
  ],
  series: [
    {
      name: 'humidity',
      type: 'line',
      yAxisIndex: 0,
    },
    {
      name: 'temperature',
      type: 'line',
      yAxisIndex: 0,
    },
    // {
    //   name: 'pressure',
    //   type: 'line',
    //   yAxisIndex: 1,
    // },
    {
      name: 'gas',
      type: 'line',
      yAxisIndex: 2,
    },
  ],
  dataZoom: [
    {
      startValue: new Date().setHours(0),
    },
    { type: 'inside' },
  ],
};

@Component({
  selector: 'sen-module-overview',
  templateUrl: './module-overview.component.html',
  styleUrls: ['./module-overview.component.scss'],
})
export class ModuleOverviewComponent {
  private unsubscribe$ = new Subject<void>();
  //! querying is sooo bad with rtdb maybe I really should just go with firestore
  chartOption: EChartsOption = baseChatOption;
  updateOption: EChartsOption = {};
  moduleId: string;

  // options
  shouldConvertToFahrenheit = true;

  constructor(
    private activeRoute: ActivatedRoute,
    private db: AngularFireDatabase,
  ) {
    this.initializeChart();
    this.unsubscribe$.subscribe(() => console.log('unsubscribed'));
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  updateSeries(series: SeriesOption[]) {
    this.updateOption = {
      ...this.updateOption,
      series,
    };
  }

  updateTitle(title: EChartsOption['title']) {
    //? why does this work when updateSeries has to keep object intact?
    this.updateOption.title = title;
  }

  initializeChart = () => {
    this.activeRoute.params
      .pipe(
        map(params => params['id']),
        filter(id => !!id),
      )
      .subscribe(id => {
        this.moduleId = id;
        const module$ = this.db.object<ModuleI>(`modules/${id}`).valueChanges();

        module$
          .pipe(
            filter(module => !!module),
            takeUntil(this.unsubscribe$),
          )
          .subscribe(module => {
            const { name } = module!;
            const title: EChartsOption['title'] = {
              text: name,
            };

            this.updateTitle(title);
          });

        const readouts$ = this.db
          .list<ReadoutI>('readouts', ref =>
            ref.orderByChild('moduleId').equalTo(id),
          )
          .valueChanges();

        readouts$
          .pipe(
            filter(readouts => !!readouts),
            takeUntil(this.unsubscribe$),
          )
          .subscribe(readouts => {
            const series: LineSeriesOption[] = [
              {
                data: readouts.map(readout => [
                  readout.timestamp,
                  readout.bme.humidity,
                ]),
              },
              {
                data: readouts.map(readout => [
                  readout.timestamp,
                  this.shouldConvertToFahrenheit
                    ? (readout.bme.temperature * 9) / 5 + 32
                    : readout.bme.temperature,
                ]),
              },
              {
                data: readouts.map(readout => [
                  readout.timestamp,
                  readout.bme.gas,
                ]),
              },
            ];

            this.updateSeries(series);
          });
      });
  };
}
