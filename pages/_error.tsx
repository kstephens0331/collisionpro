import { NextPage } from 'next'

interface ErrorProps {
  statusCode?: number
}

const Error: NextPage<ErrorProps> = ({ statusCode }) => {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f9fafb'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{
          fontSize: '3rem',
          fontWeight: 'bold',
          color: '#111827',
          marginBottom: '1rem'
        }}>
          {statusCode || 'Error'}
        </h1>
        <p style={{ color: '#6b7280' }}>
          {statusCode
            ? `An error ${statusCode} occurred on server`
            : 'An error occurred on client'}
        </p>
      </div>
    </div>
  )
}

Error.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404
  return { statusCode }
}

export default Error
