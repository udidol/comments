import styled from 'styled-components';
import { useAuthStore } from './store/authStore';
import { LoginForm } from './components/LoginForm';
import { Canvas } from './components/Canvas';

const AppContainer = styled.div`
  width: 100%;
  height: 100vh;
`;

function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  return (
    <AppContainer data-testid="app-container">
      <Canvas />
    </AppContainer>
  );
}

export default App;
