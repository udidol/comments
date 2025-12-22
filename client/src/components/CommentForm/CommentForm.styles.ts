import styled from 'styled-components';

interface ContainerProps {
  $screenX: number;
  $screenY: number;
}

export const Container = styled.div<ContainerProps>`
  position: absolute;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  padding: 12px;
  width: 260px;
  transform: translate(-50%, -100%) translateY(-10px);
  z-index: 100;
  left: ${(props) => props.$screenX}px;
  top: ${(props) => props.$screenY}px;
`;

export const Textarea = styled.textarea`
  width: 100%;
  min-height: 80px;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  resize: vertical;
  outline: none;
  margin-bottom: 8px;
  box-sizing: border-box;
  font-family: inherit;

  &:focus {
    border-color: #667eea;
  }
`;

export const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;

export const CancelButton = styled.button`
  padding: 6px 12px;
  background: none;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;

  &:hover {
    background: #f5f5f5;
  }
`;

export const SubmitButton = styled.button`
  padding: 6px 12px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;

  &:hover {
    background: #5a6fd6;
  }

  &:disabled {
    background: #a0aee8;
    cursor: not-allowed;
  }
`;
