import { Component } from "react";

export class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidUpdate(previousProps) {
    if (previousProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <section className="panel empty-state" role="alert">
          Esta sección no pudo mostrarse. Podés cambiar de página y volver a intentarlo.
        </section>
      );
    }

    return this.props.children;
  }
}
