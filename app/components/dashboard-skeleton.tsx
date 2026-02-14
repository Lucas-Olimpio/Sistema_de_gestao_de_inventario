"use client";

export default function DashboardSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Period filter skeleton */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <div
          className="skeleton"
          style={{ width: 16, height: 16, borderRadius: "4px" }}
        />
        <div
          className="skeleton"
          style={{ width: 60, height: 14, borderRadius: "6px" }}
        />
        {[80, 60, 70, 80, 100].map((w, i) => (
          <div
            key={i}
            className="skeleton"
            style={{
              width: w,
              height: 32,
              borderRadius: "var(--radius-md)",
            }}
          />
        ))}
      </div>

      {/* KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "16px",
        }}
      >
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              background: "var(--bg-card)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border-color)",
              padding: "22px",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div
                className="skeleton"
                style={{ width: "60%", height: 14, borderRadius: "6px" }}
              />
              <div
                className="skeleton"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "var(--radius-md)",
                }}
              />
            </div>
            <div>
              <div
                className="skeleton"
                style={{ width: "45%", height: 28, borderRadius: "8px" }}
              />
              <div
                className="skeleton"
                style={{
                  width: "70%",
                  height: 12,
                  borderRadius: "6px",
                  marginTop: "8px",
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Financial Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "16px",
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              background: "var(--bg-card)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border-color)",
              padding: "20px 24px",
            }}
          >
            <div
              className="skeleton"
              style={{ width: "50%", height: 11, borderRadius: "4px" }}
            />
            <div
              className="skeleton"
              style={{
                width: "70%",
                height: 24,
                borderRadius: "6px",
                marginTop: "10px",
              }}
            />
            <div
              className="skeleton"
              style={{
                width: "40%",
                height: 12,
                borderRadius: "4px",
                marginTop: "8px",
              }}
            />
          </div>
        ))}
      </div>

      {/* Chart area */}
      <div
        style={{
          background: "var(--bg-card)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--border-color)",
          padding: "24px",
        }}
      >
        <div
          className="skeleton"
          style={{ width: 200, height: 18, borderRadius: "6px" }}
        />
        <div
          className="skeleton"
          style={{
            width: "100%",
            height: 180,
            borderRadius: "var(--radius-md)",
            marginTop: "16px",
          }}
        />
      </div>

      {/* Two-column charts */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "16px",
        }}
      >
        {[0, 1].map((i) => (
          <div
            key={i}
            style={{
              background: "var(--bg-card)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border-color)",
              padding: "24px",
            }}
          >
            <div
              className="skeleton"
              style={{ width: 160, height: 18, borderRadius: "6px" }}
            />
            <div
              className="skeleton"
              style={{
                width: "100%",
                height: 160,
                borderRadius: "var(--radius-md)",
                marginTop: "16px",
              }}
            />
          </div>
        ))}
      </div>

      {/* Bottom lists */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "16px",
        }}
      >
        {[0, 1].map((col) => (
          <div
            key={col}
            style={{
              background: "var(--bg-card)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border-color)",
              padding: "24px",
            }}
          >
            <div
              className="skeleton"
              style={{ width: 180, height: 18, borderRadius: "6px" }}
            />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                marginTop: "16px",
              }}
            >
              {[0, 1, 2, 3, 4].map((row) => (
                <div
                  key={row}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "10px 0",
                    borderBottom: "1px solid var(--border-color)",
                  }}
                >
                  <div
                    className="skeleton"
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "var(--radius-md)",
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div
                      className="skeleton"
                      style={{
                        width: "70%",
                        height: 13,
                        borderRadius: "4px",
                      }}
                    />
                    <div
                      className="skeleton"
                      style={{
                        width: "40%",
                        height: 10,
                        borderRadius: "4px",
                        marginTop: "6px",
                      }}
                    />
                  </div>
                  <div
                    className="skeleton"
                    style={{
                      width: 50,
                      height: 24,
                      borderRadius: "var(--radius-md)",
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
