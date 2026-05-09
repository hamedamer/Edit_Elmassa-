import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";
import L from "leaflet";

/* =========================
   📍 AUTO LOCATION
========================= */
function AutoLocate({ setMyLocation }) {
  const map = useMap();

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition((pos) => {
      const coords = [
        pos.coords.latitude,
        pos.coords.longitude,
      ];

      setMyLocation(coords);

      map.flyTo(coords, 18);
    });
  }, []);

  return null;
}

/* =========================
   📍 LOCATION BUTTON
========================= */
function LocateButton({
  setMyLocation,
  setSelectedSec,
  setMode,
}) {
  const map = useMap();

  const locateMe = () => {
    if (!navigator.geolocation) {
      alert("المتصفح لا يدعم الموقع");
      return;
    }

    // 🔥 Reset dropdown
    setSelectedSec("");

    // 🔥 show all data
    setMode("none");

    navigator.geolocation.getCurrentPosition((pos) => {
      const coords = [
        pos.coords.latitude,
        pos.coords.longitude,
      ];

      setMyLocation(coords);

      // 🔥 zoom to location
      map.flyTo(coords, 18);
    });
  };

  return (
    <div
      style={{
        position: "absolute",
        top:
          window.innerWidth < 768
            ? "10px"
            : "20px",

        right:
          window.innerWidth < 768
            ? "10px"
            : "20px",

        zIndex: 9999,
      }}
    >
      <button
        onClick={locateMe}
        style={{
          padding:
            window.innerWidth < 768
              ? "8px 10px"
              : "10px 15px",

          background: "#16a34a",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",

          fontSize:
            window.innerWidth < 768
              ? "12px"
              : "14px",

          boxShadow:
            "0 2px 8px rgba(0,0,0,0.3)",
        }}
      >
        📍 موقعي
      </button>
    </div>
  );
}

/* =========================
   🔍 ZOOM TO DATA
========================= */
function ZoomToFiltered({ data }) {
  const map = useMap();

  useEffect(() => {
    if (!data || !data.features?.length)
      return;

    const group = L.featureGroup(
      data.features.map((f) =>
        L.geoJSON(f)
      )
    );

    map.fitBounds(group.getBounds(), {
      padding: [40, 40],
    });
  }, [data]);

  return null;
}

/* =========================
   📍 Nearby Features
========================= */
function getNearbyFeatures(
  data,
  userLocation,
  radius = 50
) {
  if (!data || !userLocation) return [];

  return data.features.filter((feature) => {
    // 🔥 create leaflet layer
    const layer = L.geoJSON(feature);

    // 🔥 get center of polygon
    const center =
      layer.getBounds().getCenter();

    // 🔥 calculate distance
    const distance = center.distanceTo(
      L.latLng(userLocation)
    );

    return distance <= radius;
  });
}

/* =========================
   MAIN APP
========================= */
export default function App() {
  const [geoData, setGeoData] =
    useState(null);

  const [selectedSec, setSelectedSec] =
    useState("");

  const [myLocation, setMyLocation] =
    useState(null);

  const [mode, setMode] =
    useState("none");

  /* =========================
     LOAD GEOJSON
  ========================= */
  useEffect(() => {
    fetch("/geo.geojson")
      .then((res) => res.json())
      .then((data) => setGeoData(data));
  }, []);

  /* =========================
     UNIQUE SECS
  ========================= */
  const uniqueSecs = geoData
    ? [
      ...new Set(
        geoData.features.map(
          (f) => f.properties.sec
        )
      ),
    ]
    : [];

  /* =========================
   VISIBLE DATA
========================= */

  // 🔥 Default = show all
  let visibleData = geoData;

  // 🔥 SEC FILTER
  if (
    mode === "sec" &&
    selectedSec &&
    geoData
  ) {
    visibleData = {
      ...geoData,
      features: geoData.features.filter(
        (f) =>
          f.properties.sec === selectedSec
      ),
    };
  }

  // 🔥 NEARBY FILTER
  if (
    mode === "nearby" &&
    myLocation &&
    geoData
  ) {
    visibleData = {
      ...geoData,
      features: getNearbyFeatures(
        geoData,
        myLocation,
        50
      ),
    };
  }

  /* =========================
     UNIT TYPE COUNTS
  ========================= */
  const unitTypeCounts = {};

  if (visibleData?.features) {
    visibleData.features.forEach((f) => {
      const type =
        f.properties.unittype ||
        "غير معروف";

      unitTypeCounts[type] =
        (unitTypeCounts[type] || 0) + 1;
    });
  }

  /* =========================
   DYNAMIC TITLE
========================= */
  const sectionTitle =
    mode === "sec" && selectedSec
      ? ` طلبات تعديل   ${selectedSec}`
      : "جميع طلبات التعديل ";

  /* =========================
     POPUP
  ========================= */
  const onEachFeature = (
    feature,
    layer
  ) => {
    const p = feature.properties;

    layer.bindPopup(`
      <div style="font-family: Arial; font-size: 12px">
        <b>Name:</b> ${p.name || "-"} <br/>
        <b>Sec:</b> ${p.sec || "-"} <br/>
        <b>Type:</b> ${p.unittype || "-"} <br/>
        <b>Street:</b> ${p.streetname || "-"} <br/>
        <b>Phone:</b> ${p.phone || "-"}
      </div>
    `);
  };

  return (<>
 
    <div style={styles.page}>
      {/* HEADER */}
      <div style={styles.header}>
        Edit Requests - Elmassa Consult
      </div>

      {/* CONTROLS */}
      <div style={styles.searchBox}>
        <select
          style={styles.input}
          value={selectedSec}
          onChange={(e) => {
            setSelectedSec(
              e.target.value
            );

            setMode("sec");
          }}
        >
          <option value="">
            اختر المنطقة
          </option>

          {uniqueSecs.map((sec, i) => (
            <option
              key={i}
              value={sec}
            >
              {sec}
            </option>
          ))}
        </select>

        <button
          style={styles.button}
          onClick={() => {
            setSelectedSec("");
            setMode("none");
          }}
        >
          Reset
        </button>
      </div>

      {/* STATS */}
      <div style={styles.statsTitle}>
        {sectionTitle}
      </div>
      <div style={styles.statsContainer}>
        {Object.entries(
          unitTypeCounts
        ).map(([type, count]) => (
          <div
            key={type}
            style={styles.statCard}
          >
            <div style={styles.statTitle}>
              {type}
            </div>

            <div style={styles.statCount}>
              {count}
            </div>
          </div>
        ))}
      </div>

      {/* MAP */}
      <div style={styles.mapBox}>
        <MapContainer
          center={[30.018, 31.225]}
          zoom={18}
          style={{
            height: "100%",
            width: "100%",
          }}
        >
          {/* 🛰️ SATELLITE */}
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution="Tiles © Esri"
          />

          {/* 📍 AUTO LOCATION */}
          <AutoLocate
            setMyLocation={
              setMyLocation
            }
          />

          {/* 📍 LOCATION BUTTON */}
          <LocateButton
            setMyLocation={
              setMyLocation
            }
            setSelectedSec={
              setSelectedSec
            }
            setMode={setMode}
          />

          {/* 📍 MY LOCATION */}
          {myLocation && (
            <Marker position={myLocation}>
              <Popup>
                📍 انت هنا
              </Popup>
            </Marker>
          )}

          {/* 🔍 ZOOM */}
          {visibleData && (
            <ZoomToFiltered
              data={visibleData}
            />
          )}

          {/* 🏢 GEOJSON */}
          {visibleData &&
            visibleData.features
              .length > 0 && (
              <GeoJSON
                data={visibleData}
                onEachFeature={
                  onEachFeature
                }
              />
            )}
        </MapContainer>
      </div>
          {/* FOOTER */}
<div style={styles.footer}>
© 2026 Built by Hamed Amer — GIS Developer 👨‍💻
</div>
    </div>

   </>);
}

/* =========================
   STYLES
========================= */
const styles = {
  footer: {
    textAlign: "center",
    padding: "10px",

    fontSize:
      window.innerWidth < 768
        ? "12px"
        : "14px",

    color: "#6b7280",

    background: "#ffffff",

    borderTop: "1px solid #e5e7eb",
  },
  statsTitle: {
    width: "fit-content",

    margin: "10px auto",

    padding:
      window.innerWidth < 768
        ? "8px 14px"
        : "10px 20px",

    background: "#ffffff",

    borderRadius: "999px",

    fontWeight: "bold",

    fontSize:
      window.innerWidth < 768
        ? "13px"
        : "18px",

    color: "#111827",

    boxShadow:
      "0 2px 10px rgba(0,0,0,0.1)",

    border: "1px solid #e5e7eb",

    textAlign: "center",
  },


  page: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "#f4f6f8",
  },

  header: {
    background: "#111827",
    color: "white",

    padding:
      window.innerWidth < 768
        ? "10px"
        : "15px",

    textAlign: "center",
    fontWeight: "bold",

    fontSize:
      window.innerWidth < 768
        ? "14px"
        : "18px",
  },

  searchBox: {
    display: "flex",
    gap: "10px",
    padding: "10px",
    justifyContent: "center",
    flexWrap: "wrap",
    alignItems: "center",
  },

  input: {
    padding:
      window.innerWidth < 768
        ? "8px"
        : "10px",

    width:
      window.innerWidth < 768
        ? "160px"
        : "250px",

    borderRadius: "8px",
    border: "1px solid #ccc",

    fontSize:
      window.innerWidth < 768
        ? "12px"
        : "14px",
  },

  button: {
    padding:
      window.innerWidth < 768
        ? "8px 10px"
        : "10px 15px",

    background: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",

    fontSize:
      window.innerWidth < 768
        ? "12px"
        : "14px",
  },

  mapBox: {
    flex: 1,

    margin:
      window.innerWidth < 768
        ? "5px"
        : "10px",

    borderRadius:
      window.innerWidth < 768
        ? "8px"
        : "12px",

    overflow: "hidden",
  },

  statsContainer: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    justifyContent: "center",
    padding: "8px",
  },

  statCard: {
    background: "white",

    padding:
      window.innerWidth < 768
        ? "8px"
        : "15px",

    borderRadius: "10px",

    minWidth:
      window.innerWidth < 768
        ? "70px"
        : "120px",

    textAlign: "center",

    boxShadow:
      "0 2px 8px rgba(0,0,0,0.1)",
  },

  statTitle: {
    fontSize:
      window.innerWidth < 768
        ? "11px"
        : "14px",

    color: "#666",
  },

  statCount: {
    fontSize:
      window.innerWidth < 768
        ? "18px"
        : "24px",

    fontWeight: "bold",
    color: "#111827",
  },
};