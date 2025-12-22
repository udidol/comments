import { useState } from "react";
import { useLogin } from "../../api/auth";
import * as S from "./LoginForm.styles";

export function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const login = useLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate({ username, password });
  };

  return (
    <S.Container data-testid="login-container">
      <S.Form onSubmit={handleSubmit} data-testid="login-form">
        <S.Title data-testid="login-title">Comments Canvas</S.Title>
        <S.Subtitle data-testid="login-subtitle">Sign in to continue</S.Subtitle>

        {login.isError && (
          <S.Error data-testid="login-error">Invalid credentials.</S.Error>
        )}

        <S.Input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
          autoFocus
          data-testid="login-username-input"
        />
        <S.Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
          data-testid="login-password-input"
        />
        <S.Button
          type="submit"
          disabled={login.isPending}
          data-testid="login-submit-button"
        >
          {login.isPending ? "Signing in..." : "Sign In"}
        </S.Button>

        <S.Hint data-testid="login-hint">
          Test users: Udi, Jonathan, Shimi, Yotam
        </S.Hint>
      </S.Form>
    </S.Container>
  );
}
