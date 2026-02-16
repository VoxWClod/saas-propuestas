import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="p-6 bg-white rounded-lg shadow-xl max-w-lg w-full">
                        <h2 className="text-xl font-bold text-red-600 mb-4">Error en el componente</h2>
                        <div className="bg-red-50 p-4 rounded border border-red-100 mb-4 overflow-auto max-h-60">
                            <pre className="text-red-800 text-xs font-mono whitespace-pre-wrap">
                                {this.state.error?.toString()}
                            </pre>
                        </div>
                        <button
                            onClick={() => this.setState({ hasError: false })}
                            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded text-gray-800 font-medium"
                        >
                            Intentar de nuevo
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
