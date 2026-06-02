import { Component, type ErrorInfo, type ReactNode } from 'react';
import { logTelemetry } from './clientTelemetry';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    void logTelemetry({
      eventName: 'ui_error_boundary',
      level: 'error',
      message: error.message,
      payload: {
        stack: error.stack ?? null,
        componentStack: errorInfo.componentStack,
      },
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24 }}>
          <h1>Произошла ошибка интерфейса</h1>
          <p>Попробуйте обновить страницу. Событие уже записано в telemetry.</p>
        </div>
      );
    }
    return this.props.children;
  }
}
