import { useState } from "react";
import styled from "styled-components";
import { useLogin } from "../api/auth";

const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
`;

const Form = styled.form`
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 360px;
`;

const Title = styled.h1`
  margin: 0 0 8px 0;
  font-size: 24px;
  text-align: center;
`;

const Subtitle = styled.p`
  margin: 0 0 24px 0;
  color: #666;
  text-align: center;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 16px;
  margin-bottom: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
  outline: none;
  box-sizing: border-box;

  &:focus {
    border-color: #667eea;
  }
`;

const Button = styled.button`
  width: 100%;
  padding: 12px 16px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  margin-top: 8px;

  &:hover {
    background: #5a6fd6;
  }

  &:disabled {
    background: #a0aee8;
    cursor: not-allowed;
  }
`;

const Error = styled.div`
  background: #fee;
  color: #c00;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 14px;
`;

const Hint = styled.p`
  margin-top: 16px;
  font-size: 12px;
  color: #999;
  text-align: center;
`;

export function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const login = useLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate({ username, password });
  };

  return (
    <Container data-testid="login-container">
      <Form onSubmit={handleSubmit} data-testid="login-form">
        <Title data-testid="login-title">Comments Canvas</Title>
        <Subtitle data-testid="login-subtitle">Sign in to continue</Subtitle>

        {login.isError && (
          <Error data-testid="login-error">Invalid credentials.</Error>
        )}

        <Input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoFocus
          data-testid="login-username-input"
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          data-testid="login-password-input"
        />
        <Button
          type="submit"
          disabled={login.isPending}
          data-testid="login-submit-button"
        >
          {login.isPending ? "Signing in..." : "Sign In"}
        </Button>

        <Hint data-testid="login-hint">
          Test users: Udi, Jonathan, Shimi, Yotam
        </Hint>
      </Form>
    </Container>
  );
}
