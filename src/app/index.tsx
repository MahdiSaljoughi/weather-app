import { MaterialCommunityIcons } from "@expo/vector-icons";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const API_KEY = "412626998bd8ab8073daeaac913e6f77";

export default function Index() {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [unit, setUnit] = useState<"metric" | "imperial">("metric");
  const [isDayTime, setIsDayTime] = useState(true);

  const fetchWeatherByCity = async (cityName: string) => {
    if (!cityName.trim()) {
      Alert.alert("خطا", "لطفاً نام شهر را وارد کنید");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${API_KEY}&units=${unit}&lang=fa`,
      );
      setWeather(response.data);
      checkDayTime(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "شهر پیدا نشد");
      setWeather(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeatherByLocation = async () => {
    setLoading(true);
    setError("");
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("دسترسی رد شد", "لطفاً دسترسی موقعیت مکانی را فعال کنید");
        setLoading(false);
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=${unit}&lang=fa`,
      );
      setWeather(response.data);
      setCity(response.data.name);
      checkDayTime(response.data);
    } catch (err) {
      setError("خطا در دریافت موقعیت مکانی");
      setWeather(null);
    } finally {
      setLoading(false);
    }
  };

  const checkDayTime = (data: any) => {
    if (data.sys && data.sys.sunrise && data.sys.sunset) {
      const now = Math.floor(Date.now() / 1000);
      const isDay = now > data.sys.sunrise && now < data.sys.sunset;
      setIsDayTime(isDay);
    }
  };

  useEffect(() => {
    fetchWeatherByLocation();
  }, []);

  const toggleUnit = () => {
    const newUnit = unit === "metric" ? "imperial" : "metric";
    setUnit(newUnit);
    if (weather) {
      if (city) fetchWeatherByCity(city);
      else fetchWeatherByLocation();
    }
  };

  type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

  const getWeatherIcon = (condition: string, iconCode?: string): IconName => {
    if (condition.includes("Clear")) {
      return isDayTime ? "weather-sunny" : "weather-night";
    }

    const isPartly =
      iconCode?.startsWith("02") ||
      iconCode?.startsWith("03") ||
      condition.includes("Few") ||
      condition.includes("Scattered") ||
      condition.includes("Partly");

    if (condition.includes("Clouds") && isPartly) {
      return isDayTime
        ? "weather-partly-cloudy"
        : "weather-night-partly-cloudy";
    }

    if (condition.includes("Clouds")) {
      return "weather-cloudy";
    }

    if (condition.includes("Rain")) return "weather-pouring";
    if (condition.includes("Drizzle")) return "weather-rainy";
    if (condition.includes("Thunderstorm")) return "weather-lightning";
    if (condition.includes("Snow")) return "weather-snowy";
    if (
      condition.includes("Mist") ||
      condition.includes("Smoke") ||
      condition.includes("Haze") ||
      condition.includes("Fog")
    )
      return "weather-fog";

    return "weather-cloudy";
  };

  if (loading) {
    return (
      <LinearGradient
        colors={["#0f0c29", "#302b63", "#24243e"]}
        style={styles.center}
      >
        <ActivityIndicator size="large" color="#a88beb" />
        <Text style={styles.loadingText}>دریافت اطلاعات آب و هوا...</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={["#0f0c29", "#302b63", "#24243e"]}
      style={styles.gradient}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={toggleUnit} style={styles.unitButton}>
            <Text style={styles.unitText}>
              {unit === "metric" ? "°C" : "°F"}
            </Text>
          </TouchableOpacity>
          <Text style={styles.title}>آب و هوا</Text>
        </View>

        <View style={styles.searchBox}>
          <TouchableOpacity
            style={styles.locationButton}
            onPress={fetchWeatherByLocation}
          >
            <MaterialCommunityIcons
              name="crosshairs-gps"
              size={22}
              color="#fff"
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => fetchWeatherByCity(city)}
          >
            <MaterialCommunityIcons name="magnify" size={22} color="#fff" />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="جستجوی شهر..."
            placeholderTextColor="#aaa"
            value={city}
            onChangeText={setCity}
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {weather && (
          <View style={styles.weatherCard}>
            <View style={styles.tempContainer}>
              <MaterialCommunityIcons
                name={getWeatherIcon(
                  weather.weather[0].main,
                  weather.weather[0].icon,
                )}
                size={90}
                color="#ffd966"
              />
              <Text style={styles.temp}>{Math.round(weather.main.temp)}°</Text>
              <Text style={styles.cityName}>{weather.name}</Text>
              <Text style={styles.description}>
                {weather.weather[0].description}
              </Text>
            </View>

            <View style={styles.detailsRow}>
              <View style={styles.detailItem}>
                <MaterialCommunityIcons
                  name="water-percent"
                  size={28}
                  color="#6c5ce7"
                />
                <Text style={styles.detailValue}>{weather.main.humidity}%</Text>
                <Text style={styles.detailLabel}>رطوبت</Text>
              </View>
              <View style={styles.detailItem}>
                <MaterialCommunityIcons
                  name="weather-windy"
                  size={28}
                  color="#6c5ce7"
                />
                <Text style={styles.detailValue}>{weather.wind.speed} m/s</Text>
                <Text style={styles.detailLabel}>باد</Text>
              </View>
              <View style={styles.detailItem}>
                <MaterialCommunityIcons
                  name="gauge"
                  size={28}
                  color="#6c5ce7"
                />
                <Text style={styles.detailValue}>
                  {weather.main.pressure} hPa
                </Text>
                <Text style={styles.detailLabel}>فشار</Text>
              </View>
            </View>

            {weather.sys && (
              <View style={styles.sunInfo}>
                <MaterialCommunityIcons
                  name="weather-sunset-up"
                  size={18}
                  color="#ddd"
                />
                <Text style={styles.sunText}>
                  طلوع:{" "}
                  {new Date(weather.sys.sunrise * 1000).toLocaleTimeString(
                    "fa-IR",
                  )}
                </Text>
                <MaterialCommunityIcons
                  name="weather-sunset-down"
                  size={18}
                  color="#ddd"
                />
                <Text style={styles.sunText}>
                  غروب:{" "}
                  {new Date(weather.sys.sunset * 1000).toLocaleTimeString(
                    "fa-IR",
                  )}
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 30,
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },
  title: { fontSize: 32, fontWeight: "700", color: "#fff", letterSpacing: 1 },
  unitButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 30,
    backdropFilter: "blur(10px)",
  },
  unitText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  searchBox: {
    flexDirection: "row",
    marginBottom: 30,
    alignItems: "center",
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 40,
    fontSize: 16,
    color: "#fff",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  searchButton: {
    backgroundColor: "#6c5ce7",
    padding: 14,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  locationButton: {
    backgroundColor: "#a29bfe",
    padding: 14,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  weatherCard: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 40,
    padding: 24,
    backdropFilter: "blur(20px)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  tempContainer: { alignItems: "center", marginBottom: 24 },
  temp: { fontSize: 72, fontWeight: "200", color: "#fff", marginVertical: 8 },
  cityName: { fontSize: 34, fontWeight: "600", color: "#fff", marginTop: 4 },
  description: {
    fontSize: 18,
    color: "#ddd",
    marginTop: 4,
    textTransform: "capitalize",
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.2)",
  },
  detailItem: { alignItems: "center" },
  detailValue: { fontSize: 18, fontWeight: "600", color: "#fff", marginTop: 6 },
  detailLabel: { fontSize: 14, color: "#ccc", marginTop: 4 },
  error: {
    color: "#ff7675",
    textAlign: "center",
    marginBottom: 20,
    fontSize: 16,
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 12,
    borderRadius: 12,
  },
  loadingText: { marginTop: 16, color: "#fff", fontSize: 16 },
  sunInfo: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.2)",
  },
  sunText: { color: "#ddd", fontSize: 13 },
});
