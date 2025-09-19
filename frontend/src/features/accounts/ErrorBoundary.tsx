import React from 'react';

interface ErrorBoundaryState { hasError: boolean; error?: any }

export class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(_error: any, _info: any) {
    // In future: send to logging service
    // console.error('ErrorBoundary', error, info);
  }

  render() {
    if (this.state.hasError) {
      return <div style={{ padding: 24 }}><h2>Something went wrong.</h2><pre>{String(this.state.error)}</pre></div>;
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
