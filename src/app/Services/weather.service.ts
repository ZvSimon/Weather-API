import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, shareReplay, switchMap, tap } from 'rxjs/operators';
import { LocationDetails } from '../Models/LocationDetails';
import { WeatherDetails } from '../Models/WeatherDetails';
import { TemperatureData } from '../Models/TemperatureData';
import { TodayData } from '../Models/TodayData';
import { WeekData } from '../Models/WeekData';
import { TodaysHighlight } from '../Models/TodaysHighlight';
import { EnvironmentalVariables } from '../Environment/EnvironmentVariables';

@Injectable({
  providedIn: 'root',
})
export class WeatherService {
  private locationCache: { [key: string]: Observable<LocationDetails> } = {};
  private weatherCache: { [key: string]: Observable<WeatherDetails> } = {};

  //Variables which will be filled by API Endpoints
  locationDetails?: LocationDetails;
  weatherDetails?: WeatherDetails;

  //Variables that have the extracted data from the API Endpoint Variables
  temperatureData: TemperatureData = new TemperatureData(); //Left-Container Data

  todayData?: TodayData[] = []; //Right-Container Data
  weekData?: WeekData[] = []; //Right-Container Data
  todaysHighlight?: TodaysHighlight = new TodaysHighlight(); //Right-Container Data

  //variables to be used for API calls
  cityName: string = 'Paris';
  language: string = 'fr-FR';
  date: string = '20240614';
  units: string = 'm';

  //Variable holding current Time;
  currentTime: Date = new Date();

  // variables to control tabs
  today: boolean = false;
  week: boolean = true;

  //variables to control metric value
  celsius: boolean = true;
  fahrenheit: boolean = false;

  constructor(private httpClient: HttpClient) {
    this.getData();
  }

  getSummaryImage(summary: string): string {
    const baseAddress = 'assets/';
    const imageMap: { [key: string]: string } = {
      'Partly Cloudy': 'cloudyandsunny.png',
      'P Cloudy': 'cloudyandsunny.png',
      'Partly Rainy': 'rainyandsunny.png',
      'P Rainy': 'rainyandsunny.png',
      wind: 'windy.png',
      rain: 'rainy.png',
      Sun: 'sun.png',
    };

    if (!summary) {
      return baseAddress + 'cloudyandsunny.png'; // valeur par défaut si summary est null ou undefined
    }

    for (const key in imageMap) {
      if (summary.includes(key)) {
        return baseAddress + imageMap[key];
      }
    }

    return baseAddress + 'cloudyandsunny.png'; // valeur par défaut si aucun match
  }

  fillTemperatureDataModel(): void {
    this.currentTime = new Date();
    this.temperatureData.day =
      this.weatherDetails['v3-wx-observations-current'].dayOfWeek;
    this.temperatureData.time = `${String(this.currentTime.getHours()).padStart(
      2,
      '0'
    )}:${String(this.currentTime.getMinutes()).padStart(2, '0')}`;
    this.temperatureData.temperature =
      this.weatherDetails['v3-wx-observations-current'].temperature;
    this.temperatureData.location = `${this.locationDetails.location.city[0]},${this.locationDetails.location.country[0]}`;
    this.temperatureData.rainPercent =
      this.weatherDetails['v3-wx-observations-current'].precip24Hour;
    this.temperatureData.summaryPhrase =
      this.weatherDetails['v3-wx-observations-current'].wxPhraseShort;
    this.temperatureData.summaryImage = this.getSummaryImage(
      this.temperatureData.summaryPhrase
    );
  }

  fillWeekData(): void {
    for (let weekCount = 0; weekCount < 7; weekCount++) {
      const week = new WeekData();
      week.day = this.weatherDetails['v3-wx-forecast-daily-15day'].dayOfWeek[
        weekCount
      ].slice(0, 3);
      week.tempMax =
        this.weatherDetails[
          'v3-wx-forecast-daily-15day'
        ].calendarDayTemperatureMax[weekCount];
      week.tempMin =
        this.weatherDetails[
          'v3-wx-forecast-daily-15day'
        ].calendarDayTemperatureMin[weekCount];
      week.summaryImage = this.getSummaryImage(
        this.weatherDetails['v3-wx-forecast-daily-15day'].narrative[weekCount]
      );
      this.weekData.push(week);
    }
  }

  fillTodayData(): void {
    for (let todayCount = 0; todayCount < 7; todayCount++) {
      const today = new TodayData();
      today.time = this.weatherDetails[
        'v3-wx-forecast-hourly-10day'
      ].validTimeLocal[todayCount].slice(11, 16);
      today.temperature =
        this.weatherDetails['v3-wx-forecast-hourly-10day'].temperature[
          todayCount
        ];
      today.summaryImage = this.getSummaryImage(
        this.weatherDetails['v3-wx-forecast-hourly-10day'].wxPhraseShort[
          todayCount
        ]
      );
      this.todayData.push(today);
    }
  }

  getTimeFromString(localTime: string): string {
    return localTime.slice(11, 16);
  }

  fillTodaysHighlight(): void {
    this.todaysHighlight.airQuality =
      this.weatherDetails[
        'v3-wx-globalAirQuality'
      ].globalairquality.airQualityIndex;
    this.todaysHighlight.humidity =
      this.weatherDetails['v3-wx-observations-current'].relativeHumidity;
    this.todaysHighlight.sunrise = this.getTimeFromString(
      this.weatherDetails['v3-wx-observations-current'].sunriseTimeLocal
    );
    this.todaysHighlight.sunset = this.getTimeFromString(
      this.weatherDetails['v3-wx-observations-current'].sunsetTimeLocal
    );
    this.todaysHighlight.uvIndex =
      this.weatherDetails['v3-wx-observations-current'].uvIndex;
    this.todaysHighlight.visibility =
      this.weatherDetails['v3-wx-observations-current'].visibility;
    this.todaysHighlight.windStatus =
      this.weatherDetails['v3-wx-observations-current'].windSpeed;
  }

  prepareData(): void {
    this.fillTemperatureDataModel();
    this.fillWeekData();
    this.fillTodayData();
    this.fillTodaysHighlight();
    console.log(this.weatherDetails);
    console.log(this.temperatureData);
    console.log(this.weekData);
    console.log(this.todayData);
    console.log(this.todaysHighlight);
  }

  celsiusToFahrenheit(celsius: number): number {
    return +(celsius * 1.8 + 32).toFixed(2);
  }

  fahrenheitToCelsius(fahrenheit: number): number {
    return +((fahrenheit - 32) * 0.555).toFixed(2);
  }

  getLocationDetails(
    cityName: string,
    language: string
  ): Observable<LocationDetails> {
    const cacheKey = `${cityName}-${language}`;
    if (!this.locationCache[cacheKey]) {
      this.locationCache[cacheKey] = this.httpClient
        .get<LocationDetails>(
          EnvironmentalVariables.weatherApiLocationBaseURL,
          {
            headers: new HttpHeaders()
              .set(
                EnvironmentalVariables.xRapidApiKeyName,
                EnvironmentalVariables.xRapidApikeyValue
              )
              .set(
                EnvironmentalVariables.xRapidApiHostName,
                EnvironmentalVariables.xRapidApiHostValue
              ),
            params: new HttpParams()
              .set('query', cityName)
              .set('language', language),
          }
        )
        .pipe(
          shareReplay(1),
          catchError((err) => {
            console.error('Error fetching location details', err);
            return of(null); // Return a null observable on error
          })
        );
    }
    return this.locationCache[cacheKey];
  }

  getWeatherReport(
    date: string,
    latitude: number,
    longitude: number,
    language: string,
    units: string
  ): Observable<WeatherDetails> {
    const cacheKey = `${date}-${latitude}-${longitude}-${language}-${units}`;
    if (!this.weatherCache[cacheKey]) {
      this.weatherCache[cacheKey] = this.httpClient
        .get<WeatherDetails>(EnvironmentalVariables.weatherApiForecastBaseURL, {
          headers: new HttpHeaders()
            .set(
              EnvironmentalVariables.xRapidApiKeyName,
              EnvironmentalVariables.xRapidApikeyValue
            )
            .set(
              EnvironmentalVariables.xRapidApiHostName,
              EnvironmentalVariables.xRapidApiHostValue
            ),
          params: new HttpParams()
            .set('date', date)
            .set('latitude', latitude)
            .set('longitude', longitude)
            .set('language', language)
            .set('units', units),
        })
        .pipe(
          shareReplay(1),
          catchError((err) => {
            console.error('Error fetching weather report', err);
            return of(null); // Return a null observable on error
          })
        );
    }
    return this.weatherCache[cacheKey];
  }
  getData(): void {
    this.todayData = [];
    this.weekData = [];
    this.temperatureData = new TemperatureData();
    this.todaysHighlight = new TodaysHighlight();

    this.getLocationDetails(this.cityName, this.language)
      .pipe(
        tap((response) => {
          this.locationDetails = response;
        }),
        switchMap((response) => {
          if (response) {
            const latitude = this.locationDetails.location.latitude[0];
            const longitude = this.locationDetails.location.longitude[0];
            return this.getWeatherReport(
              this.date,
              latitude,
              longitude,
              this.language,
              this.units
            );
          }
          return of(null);
        }),
        tap((weatherResponse) => {
          if (weatherResponse) {
            this.weatherDetails = weatherResponse;
            this.prepareData();
          }
        })
      )
      .subscribe();
  }
}
