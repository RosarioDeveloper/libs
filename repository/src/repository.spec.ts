import { TestingModule } from '@nestjs/testing';
import { testModule } from '@test/bootstrap';
import { Injectable } from '@nestjs/common';
import { Firebase, InjectFirebase } from '@libs/firebase';
import { BaseRepository } from './repository';

interface User {
   id: string;
   name: string;
   email: string;
   created_at?: string;
   updated_at?: string;
}

@Injectable()
export class RepoService extends BaseRepository<User> {
   constructor(@InjectFirebase() private firebase: Firebase) {
      super({
         service: firebase,
         collection: 'organizations/axonobel/industries/axonobel/users',
      });
   }
}

describe('Repository', () => {
   let service: BaseRepository<User>;

   beforeEach(async () => {
      const app: TestingModule = await testModule({
         imports: [],
         providers: [RepoService],
      }).compile();

      service = app.get(RepoService);
   });

   describe('Should be Defined', () => {
      it('should return "Hello World!"', async () => {
         // const response = await service.paginate({
         //    where: {
         //       name: { $lessThan: 22 },
         //    },
         // });

         // const response = await service.delete(['8CLKPimTdvoDuTi45mjB']);
         const response = await service.create({
            name: 'wefwefwf',
            email: 'rosario10@gmail.com',
         });

         // const response = service.pathToCollection(
         //    'wtmgo/organizations/axonobel/industries/efwefwefwegfwef',
         // );

         console.log(response);
         expect(service).toBeDefined();
      });
   });
});
