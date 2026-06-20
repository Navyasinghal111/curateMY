export default function UnderConstruction() {
  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#FAFAF8',
        textAlign: 'center',
        fontFamily: 'system-ui, sans-serif',
        padding: '24px',
      }}
    >
      <h1
        style={{
          fontSize: 'clamp(36px, 8vw, 72px)',
          fontWeight: 800,
          color: '#141210',
          margin: 0,
          marginBottom: '16px',
          letterSpacing: '-0.02em',
        }}
      >
        CurateKin
      </h1>
      <p
        style={{
          fontSize: 'clamp(18px, 4vw, 28px)',
          fontWeight: 600,
          color: '#141210',
          margin: 0,
        }}
      >
        🚧 UNDER CONSTRUCTION 🚧
      </p>
      <p
        style={{
          fontSize: '16px',
          color: '#3A3630',
          marginTop: '20px',
          maxWidth: '400px',
        }}
      >
        We&apos;re building something special. Check back soon.
      </p>
    </div>
  )
}