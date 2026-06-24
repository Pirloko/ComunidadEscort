import { Component, type ReactNode } from 'react'
import { ErrorState } from '@/components/shared/ErrorState'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: unknown) {
    console.error('Error no controlado en la página:', error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorState
          title="No pudimos cargar esta página"
          message="Ocurrió un error inesperado. Intenta recargar."
          onRetry={() => window.location.reload()}
        />
      )
    }
    return this.props.children
  }
}
