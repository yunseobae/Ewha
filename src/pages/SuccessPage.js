import React from 'react';
import { Link } from 'react-router-dom';

function SuccessPage() {
  return (
    <div>
      <h2>신청이 완료되었습니다!</h2>
      <Link to="/">처음으로 돌아가기</Link>
    </div>
  );
}

export default SuccessPage;
